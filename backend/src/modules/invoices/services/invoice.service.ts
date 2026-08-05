import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { AppError } from '../../../core/errors/appError';
import { auditPort } from '../../../core/ports/auditPort';
import type {
  BillingSettlementPort,
  ConfirmSettlementInput,
  ConfirmSettlementResult,
} from '../../../core/ports/billingSettlementPort';
import { setBillingSettlementPort } from '../../../core/ports/billingSettlementPort';
import type {
  BillingPaymentIntentPort,
  RegisterMomoIntentInput,
  RegisterMomoIntentResult,
} from '../../../core/ports/billingPaymentIntentPort';
import { setBillingPaymentIntentPort } from '../../../core/ports/billingPaymentIntentPort';
import {
  formatDateOnly,
  formatVietnamDbDateTime,
  getVietnamLegalDate,
  getVietnamNowIso,
  parseLegalDateString,
  toVietnamDbDateTime,
} from '../../../core/time/vietnamClock';
import { prisma } from '../../../core/prisma/prisma';
import { HI_RULE_SOURCE_DRAFT } from '../constants/invoice.constants';
import { invoiceRepository } from '../repositories/invoice.repository';
import type { InvoiceDto } from '../types/invoice.types';
import {
  calculateHealthInsurance,
  benefitLevelToRateString,
  toMoneyString,
} from '../utils/money';

type BenefitLevel = 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100';
type RouteType = 'right_route' | 'referral' | 'emergency' | 'wrong_route';

/** Xác định nhóm bảng kê từ mã/tên danh mục để không ghi mọi dịch vụ thành khám bệnh. */
function mapServiceCategory(
  code: string,
  name: string,
): 'consultation' | 'lab' | 'medicine' | 'bed' | 'procedure' | 'other' {
  const source = `${code} ${name}`.toLocaleLowerCase('vi-VN');
  if (source.includes('xet') || source.includes('lab')) return 'lab';
  if (source.includes('thuoc') || source.includes('thuốc') || source.includes('medicine')) {
    return 'medicine';
  }
  if (source.includes('giuong') || source.includes('giường') || source.includes('bed')) {
    return 'bed';
  }
  if (source.includes('phau') || source.includes('phẫu') || source.includes('procedure')) {
    return 'procedure';
  }
  if (source.includes('kham') || source.includes('khám') || source.includes('consult')) {
    return 'consultation';
  }
  return 'other';
}

/**
 * Map entity → contract DTO (money string).
 */
function toInvoiceDto(
  invoice: NonNullable<Awaited<ReturnType<typeof invoiceRepository.findById>>>,
): InvoiceDto {
  const rate = invoice.healthInsuranceBenefitRateSnapshot ?? '0.0000';
  const isFinal = invoice.status === 'paid' || invoice.status === 'write_off';

  return {
    invoiceId: invoice.id,
    recordId: invoice.recordId,
    status: invoice.status,
    healthInsuranceEligibility: {
      cardStatus:
        invoice.healthInsuranceBenefitLevel === 'NO_COVERAGE' ? 'none_or_expired' : 'valid',
      effectiveBenefitLevel: invoice.healthInsuranceBenefitLevel,
      effectiveBenefitRate: rate,
      healthInsuranceRouteType: invoice.healthInsuranceRouteType,
      healthInsuranceRuleSource: invoice.healthInsuranceRuleSource,
      noticeCode: null,
    },
    items: invoice.items.map((item) => ({
      invoiceItemId: item.id,
      description: item.description,
      category: item.category,
      quantity: toMoneyString(item.quantity),
      unitPrice: toMoneyString(item.unitPrice),
      amount: toMoneyString(item.amount),
      coveredByHealthInsurance: item.coveredByHealthInsurance,
      healthInsuranceBenefitLevel: item.healthInsuranceBenefitLevel,
      healthInsuranceBenefitRateSnapshot: item.healthInsuranceBenefitRateSnapshot,
      healthInsuranceEligibleAmount: toMoneyString(item.healthInsuranceEligibleAmount),
      healthInsuranceCeilingAmount: toMoneyString(item.healthInsuranceCeilingAmount),
      healthInsuranceFundAmount: toMoneyString(item.healthInsuranceFundAmount),
      patientCoPayAmount: toMoneyString(item.patientCoPayAmount),
    })),
    subtotal: toMoneyString(invoice.subtotal),
    healthInsuranceBaseAmount: toMoneyString(invoice.healthInsuranceBaseAmount),
    healthInsuranceDiscountAmount: toMoneyString(invoice.healthInsuranceDiscountAmount),
    totalAmount: toMoneyString(invoice.totalAmount),
    advanceAppliedAmount: toMoneyString(invoice.advanceAppliedAmount),
    amountDue: toMoneyString(invoice.amountDue),
    paymentMethod: invoice.paymentMethod,
    receiptNumber: invoice.receiptNumber,
    paidAt: formatVietnamDbDateTime(invoice.paidAt),
    momoOrderId: invoice.momoOrderId,
    statement: {
      status: invoice.statementStatus,
      copies: 2,
      statementNumber: invoice.statementNumber,
    },
    healthInsuranceClaim: invoice.claim
      ? {
          claimId: invoice.claim.id,
          status: invoice.claim.status,
          source: 'auto_on_invoice',
        }
      : null,
    settlement: {
      isSettlementFinal: isFinal,
      allowedStatuses: ['paid', 'write_off'],
      writeOffEligibility: 'emergency_with_approval_only',
    },
    version: invoice.version,
    patient: invoice.medicalRecord
      ? {
          patientId: invoice.medicalRecord.patient.id,
          patientCode: invoice.medicalRecord.patient.patientCode,
          fullName: invoice.medicalRecord.patient.fullName,
          recordCode: invoice.medicalRecord.recordCode,
          treatmentType: invoice.medicalRecord.treatmentType,
          bedId: invoice.medicalRecord.bedId,
          department: invoice.medicalRecord.department?.name ?? null,
        }
      : undefined,
  };
}

/**
 * Nghiệp vụ hóa đơn + implement settlement/intent ports.
 */
export class InvoiceService implements BillingSettlementPort, BillingPaymentIntentPort {
  /**
   * Tạo invoice pending từ service_orders (charge projection mock).
   */
  async createInvoice(input: {
    recordId: string;
    healthInsuranceBenefitLevel: BenefitLevel;
    healthInsuranceRouteType?: RouteType;
    statementIssueRequested?: boolean;
    actorUserId?: string;
  }): Promise<InvoiceDto> {
    const record = await invoiceRepository.findMedicalRecord(input.recordId);
    if (!record) {
      throw new AppError(404, 'RECORD_NOT_FOUND', 'Không tìm thấy hồ sơ bệnh án');
    }

    const existingPending = await invoiceRepository.findPendingByRecordId(input.recordId);
    if (existingPending) {
      throw new AppError(400, 'INVOICE_ALREADY_EXISTS', 'Hồ sơ đã có hóa đơn đang chờ thanh toán', [
        {
          field: 'invoiceId',
          rule: 'pending_invoice_exists',
          message: existingPending.id,
        },
      ]);
    }

    // Ép NO_COVERAGE nếu không có thẻ / hết hạn
    let benefitLevel = input.healthInsuranceBenefitLevel;
    const expiry = record.patient.healthInsuranceExpiryDate;
    const hasCard = Boolean(record.patient.healthInsuranceCode && expiry);
    const expired = !expiry || expiry.getTime() < getVietnamLegalDate().getTime();
    if (!hasCard || expired) {
      benefitLevel = 'NO_COVERAGE';
    }

    const orders = await invoiceRepository.findServiceOrdersForRecord(input.recordId);
    if (orders.length === 0) {
      throw new AppError(400, 'INCOMPLETE_COST_DATA', 'Chưa có dịch vụ/chi phí để lập hóa đơn');
    }

    const zero = new Prisma.Decimal(0);
    const calculation = calculateHealthInsurance(
      benefitLevel,
      orders.map((order) => ({
        amount: order.fee,
        coveredByHealthInsurance: order.serviceCatalog.coveredByHealthInsurance,
        ceilingPrice: order.serviceCatalog.healthInsuranceCeilingPrice,
      })),
    );
    const rateStr = benefitLevelToRateString(benefitLevel);
    const subtotal = orders.reduce((total, order) => total.add(order.fee), zero).toDecimalPlaces(2);

    const items = orders.map((order, index) => {
      const line = calculation.lines[index];
      if (!line) {
        throw new AppError(400, 'INVALID_AMOUNT', 'Không thể đối chiếu dòng chi phí BHYT');
      }
      const unitPrice = order.fee;
      const quantity = new Prisma.Decimal(1);
      const amount = unitPrice.mul(quantity);

      return {
        description: order.serviceCatalog.name,
        category: mapServiceCategory(order.serviceCatalog.code, order.serviceCatalog.name),
        quantity,
        unitPrice,
        amount,
        coveredByHealthInsurance: line.coveredByHealthInsurance,
        healthInsuranceBenefitLevel: line.coveredByHealthInsurance ? benefitLevel : null,
        healthInsuranceBenefitRateSnapshot: line.healthInsuranceBenefitRateSnapshot,
        healthInsuranceEligibleAmount: line.healthInsuranceEligibleAmount,
        healthInsuranceCeilingAmount: line.healthInsuranceCeilingAmount,
        healthInsuranceFundAmount: line.healthInsuranceFundAmount,
        patientCoPayAmount: line.patientCoPayAmount,
        sortOrder: index,
      };
    });

    const totalAmount = calculation.totalPatientAmount.toDecimalPlaces(2);
    const advanceApplied = zero;
    const amountDue = totalAmount.sub(advanceApplied).toDecimalPlaces(2);

    if (amountDue.lt(0)) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Số tiền phải trả không hợp lệ');
    }

    const createClaim = calculation.healthInsuranceDiscountAmount.gt(zero);

    const invoice = await invoiceRepository.createWithItems({
      recordId: input.recordId,
      healthInsuranceBenefitLevel: benefitLevel,
      healthInsuranceRouteType:
        benefitLevel === 'NO_COVERAGE' ? null : (input.healthInsuranceRouteType ?? null),
      healthInsuranceBenefitRateSnapshot: rateStr,
      healthInsuranceRuleSource: HI_RULE_SOURCE_DRAFT,
      subtotal,
      healthInsuranceBaseAmount: calculation.healthInsuranceBaseAmount,
      healthInsuranceDiscountAmount: calculation.healthInsuranceDiscountAmount,
      totalAmount,
      advanceAppliedAmount: advanceApplied,
      amountDue,
      items,
      createClaim,
    });

    await auditPort.record({
      action: 'invoice.create',
      resource: 'Invoice',
      resourceId: invoice.id,
      userId: input.actorUserId,
      metadata: {
        recordId: input.recordId,
        amountDue: toMoneyString(invoice.amountDue),
        advanceAppliedAmount: toMoneyString(invoice.advanceAppliedAmount),
      },
    });

    return toInvoiceDto(invoice);
  }

  async getInvoice(invoiceId: string): Promise<InvoiceDto> {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new AppError(404, 'INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn');
    }
    return toInvoiceDto(invoice);
  }

  /**
   * Tổng hợp báo cáo theo ngày từ các bản ghi tài chính đã chốt.
   * Khoảng ngày dùng legal clock Việt Nam và không trả dữ liệu bệnh án ngoài thông tin hiển thị cần thiết.
   */
  async getAccountingReport(input: { from: string; to: string }) {
    const start = parseLegalDateString(input.from);
    const end = new Date(parseLegalDateString(input.to));
    end.setUTCDate(end.getUTCDate() + 1);
    const dateWhere = { gte: start, lt: end };

    const [paidInvoices, advances, writeOffInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: 'paid', paidAt: dateWhere },
        orderBy: { paidAt: 'asc' },
        select: {
          id: true,
          amountDue: true,
          healthInsuranceDiscountAmount: true,
          paidAt: true,
          paymentMethod: true,
          receiptNumber: true,
          medicalRecord: {
            select: { patient: { select: { patientCode: true, fullName: true } } },
          },
        },
      }),
      prisma.paymentAdvance.findMany({
        where: { createdAt: dateWhere },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          amount: true,
          method: true,
          receiptNumber: true,
          createdAt: true,
          medicalRecord: {
            select: { patient: { select: { patientCode: true, fullName: true } } },
          },
        },
      }),
      prisma.invoice.findMany({
        where: { status: 'write_off', writeOffAt: dateWhere },
        orderBy: { writeOffAt: 'asc' },
        select: {
          id: true,
          totalAmount: true,
          writeOffAt: true,
          medicalRecord: {
            select: { patient: { select: { patientCode: true, fullName: true } } },
          },
        },
      }),
    ]);

    const logs = [
      ...paidInvoices.map((invoice) => ({
        id: invoice.receiptNumber ?? invoice.id,
        time: formatVietnamDbDateTime(invoice.paidAt) ?? input.from,
        type: 'invoice_payment' as const,
        patientName: invoice.medicalRecord.patient.fullName,
        patientCode: invoice.medicalRecord.patient.patientCode,
        method: invoice.paymentMethod === 'momo' ? ('momo' as const) : ('cash' as const),
        amount: toMoneyString(invoice.amountDue),
        cashier: 'accounting',
        status: 'success' as const,
      })),
      ...advances.map((advance) => ({
        id: advance.receiptNumber ?? advance.id,
        time: formatVietnamDbDateTime(advance.createdAt) ?? input.from,
        type: advance.type === 'deposit' ? ('advance_deposit' as const) : ('advance_refund' as const),
        patientName: advance.medicalRecord.patient.fullName,
        patientCode: advance.medicalRecord.patient.patientCode,
        method: advance.method,
        amount: toMoneyString(advance.amount),
        cashier: 'accounting',
        status: 'success' as const,
      })),
      ...writeOffInvoices.map((invoice) => ({
        id: invoice.id,
        time: formatVietnamDbDateTime(invoice.writeOffAt) ?? input.from,
        type: 'write_off' as const,
        patientName: invoice.medicalRecord.patient.fullName,
        patientCode: invoice.medicalRecord.patient.patientCode,
        method: 'write_off' as const,
        amount: toMoneyString(invoice.totalAmount),
        cashier: 'accounting',
        status: 'success' as const,
      })),
    ].sort((left, right) => left.time.localeCompare(right.time));

    const sum = (values: Prisma.Decimal[]) =>
      values.reduce((total, value) => total.add(value), new Prisma.Decimal(0));
    const paidCash = sum(
      paidInvoices.filter((invoice) => invoice.paymentMethod === 'cash').map((invoice) => invoice.amountDue),
    );
    const paidMomo = sum(
      paidInvoices.filter((invoice) => invoice.paymentMethod === 'momo').map((invoice) => invoice.amountDue),
    );
    const deposits = sum(
      advances.filter((advance) => advance.type === 'deposit').map((advance) => advance.amount),
    );
    const refunds = sum(
      advances.filter((advance) => advance.type === 'refund').map((advance) => advance.amount),
    );
    const healthInsurance = sum(paidInvoices.map((invoice) => invoice.healthInsuranceDiscountAmount));
    const writeOff = sum(writeOffInvoices.map((invoice) => invoice.totalAmount));

    return {
      summary: {
        cashierName: 'accounting',
        cashierRole: 'accountant',
        shiftCode: `CA-${formatDateOnly(start)}`,
        startTime: input.from,
        endTime: input.to,
        cashTotal: toMoneyString(paidCash),
        transferTotal: toMoneyString(paidMomo),
        advanceCollectedTotal: toMoneyString(deposits),
        advanceRefundedTotal: toMoneyString(refunds),
        healthInsuranceTotal: toMoneyString(healthInsurance),
        writeOffTotal: toMoneyString(writeOff),
        netRevenue: toMoneyString(sum(paidInvoices.map((invoice) => invoice.amountDue))),
        totalTransactionsCount: logs.length,
      },
      logs,
    };
  }

  async listInvoices(params: {
    recordId?: string;
    status?: 'pending' | 'paid' | 'cancelled' | 'write_off';
    page: number;
    pageSize: number;
  }) {
    const skip = (params.page - 1) * params.pageSize;
    const { items, total } = await invoiceRepository.list({
      recordId: params.recordId,
      status: params.status,
      skip,
      take: params.pageSize,
    });

    return {
      data: items.map((item) => toInvoiceDto(item)),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      },
    };
  }

  async listInvoiceCandidates(params: { page: number; pageSize: number }) {
    const skip = (params.page - 1) * params.pageSize;
    const { items, total } = await invoiceRepository.listInvoiceCandidates({
      skip,
      take: params.pageSize,
    });

    return {
      data: items.map((item) => ({
        recordId: item.id,
        recordCode: item.recordCode,
        treatmentType: item.treatmentType,
        bedId: item.bedId,
        isEmergency: item.isEmergency,
        createdAt: item.createdAt.toISOString(),
        department: item.department?.name ?? null,
        patient: {
          patientId: item.patient.id,
          patientCode: item.patient.patientCode,
          fullName: item.patient.fullName,
          dateOfBirth: item.patient.dateOfBirth.toISOString(),
          gender: item.patient.gender,
          phoneNumber: item.patient.phoneNumber,
          identityCardNumber: item.patient.identityCardNumber,
          healthInsuranceCode: item.patient.healthInsuranceCode,
          healthInsuranceExpiryDate: item.patient.healthInsuranceExpiryDate?.toISOString() ?? null,
        },
        serviceOrders: item.serviceOrders.map((serviceOrder) => ({
          id: serviceOrder.id,
          code: serviceOrder.serviceCatalog.code,
          name: serviceOrder.serviceCatalog.name,
          fee: toMoneyString(serviceOrder.fee),
        })),
      })),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      },
    };
  }

  async cancelInvoice(input: {
    invoiceId: string;
    expectedVersion: number;
    cancelReason: string;
    actorUserId?: string;
  }): Promise<InvoiceDto> {
    const updated = await invoiceRepository.cancelPending({
      invoiceId: input.invoiceId,
      expectedVersion: input.expectedVersion,
      cancelReason: input.cancelReason,
      cancelledAt: toVietnamDbDateTime(),
    });

    if (!updated) {
      throw new AppError(
        409,
        'INVOICE_NOT_PENDING',
        'Chỉ hủy được hóa đơn đang chờ thanh toán (hoặc xung đột phiên bản)',
      );
    }

    await auditPort.record({
      action: 'invoice.cancel',
      resource: 'Invoice',
      resourceId: input.invoiceId,
      userId: input.actorUserId,
      metadata: { hasReason: true },
    });

    return toInvoiceDto(updated);
  }

  /**
   * Xử lý write-off chỉ cho hóa đơn pending của hồ sơ cấp cứu đặc biệt.
   * Ghi approval, cập nhật hóa đơn và audit theo cùng optimistic-lock version.
   */
  async writeOffInvoice(input: {
    invoiceId: string;
    expectedVersion: number;
    writeOffReason: string;
    actorUserId?: string;
  }): Promise<InvoiceDto> {
    if (!input.actorUserId) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập để duyệt write-off');
    }

    const invoice = await invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new AppError(404, 'INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn');
    }
    if (invoice.status !== 'pending') {
      throw new AppError(
        409,
        'INVOICE_NOT_PENDING',
        'Chỉ write-off được hóa đơn đang chờ thanh toán',
      );
    }
    if (!invoice.medicalRecord?.isEmergency) {
      throw new AppError(
        400,
        'WRITE_OFF_NOT_ALLOWED_NON_EMERGENCY',
        'Chỉ áp dụng miễn giảm thất thu cho ca cấp cứu đặc biệt.',
      );
    }

    const approvedAt = toVietnamDbDateTime();
    const updated = await invoiceRepository.writeOffEmergency({
      invoiceId: input.invoiceId,
      expectedVersion: input.expectedVersion,
      writeOffReason: input.writeOffReason,
      approvedByUserId: input.actorUserId,
      approvedAt,
    });

    if (!updated) {
      throw new AppError(
        409,
        'INVOICE_NOT_PENDING',
        'Hóa đơn vừa được cập nhật. Vui lòng tải lại dữ liệu trước khi duyệt.',
      );
    }

    await invoiceRepository.closeRecordIfOpen(invoice.recordId);
    await auditPort.record({
      action: 'invoice.write_off',
      resource: 'Invoice',
      resourceId: input.invoiceId,
      userId: input.actorUserId,
      metadata: { emergency: true, approvedInvoiceVersion: input.expectedVersion },
    });

    return toInvoiceDto(updated);
  }

  /**
   * BillingSettlementPort — cash/Momo settle.
   */
  async confirm(input: ConfirmSettlementInput): Promise<ConfirmSettlementResult> {
    const invoice = await invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new AppError(404, 'INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn');
    }
    if (invoice.status !== 'pending') {
      // Idempotent replay: already paid with same method
      if (invoice.status === 'paid') {
        // Backfill paidAt nếu thiếu (dữ liệu cũ / settle lỗi trước đây).
        if (!invoice.paidAt) {
          const backfill = toVietnamDbDateTime();
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { paidAt: backfill, updatedAt: backfill },
          });
          return {
            invoiceId: invoice.id,
            paymentMethod: invoice.paymentMethod ?? input.method,
            status: 'paid',
            receiptNumber: invoice.receiptNumber ?? '',
            paidAt: formatVietnamDbDateTime(backfill) ?? getVietnamNowIso(),
            amountDue: toMoneyString(invoice.amountDue),
            version: invoice.version,
          };
        }
        return {
          invoiceId: invoice.id,
          paymentMethod: invoice.paymentMethod ?? input.method,
          status: 'paid',
          receiptNumber: invoice.receiptNumber ?? '',
          paidAt: formatVietnamDbDateTime(invoice.paidAt) ?? getVietnamNowIso(),
          amountDue: toMoneyString(invoice.amountDue),
          version: invoice.version,
        };
      }
      throw new AppError(400, 'INVOICE_NOT_PENDING', 'Hóa đơn không ở trạng thái chờ thanh toán');
    }

    // Thời điểm giao dịch wall-clock VN (luôn có giá trị, không để null).
    const paidAt = toVietnamDbDateTime(input.paidAt ? new Date(input.paidAt) : new Date());
    const receiptNumber = await invoiceRepository.nextReceiptNumber(
      input.method === 'cash' ? 'PT' : 'MM',
    );

    const updated = await invoiceRepository.markPaid({
      invoiceId: input.invoiceId,
      expectedVersion: invoice.version,
      method: input.method,
      receiptNumber,
      paidAt,
      momoOrderId: input.momoOrderId ?? invoice.momoOrderId ?? undefined,
    });

    if (!updated) {
      throw new AppError(409, 'VERSION_CONFLICT', 'Hóa đơn vừa được cập nhật. Thử lại.');
    }

    if (!updated.paidAt) {
      // Force lần cuối — không để paid mà thiếu paid_at
      await prisma.invoice.update({
        where: { id: updated.id },
        data: { paidAt, updatedAt: paidAt },
      });
    }

    // Outpatient: đóng hồ sơ sau thanh toán (MVP)
    await invoiceRepository.closeRecordIfOpen(invoice.recordId);

    await auditPort.record({
      action: 'invoice.settle',
      resource: 'Invoice',
      resourceId: invoice.id,
      userId: input.actorUserId,
      metadata: {
        method: input.method,
        hasTransId: Boolean(input.transId),
        paidAt: formatVietnamDbDateTime(paidAt),
      },
    });

    return {
      invoiceId: updated.id,
      paymentMethod: input.method,
      status: 'paid',
      receiptNumber,
      paidAt: formatVietnamDbDateTime(paidAt) ?? getVietnamNowIso(),
      amountDue: toMoneyString(updated.amountDue),
      version: updated.version,
      recordClosure: {
        performed: true,
        recordId: invoice.recordId,
        status: 'closed',
      },
    };
  }

  /**
   * BillingPaymentIntentPort — đăng ký Momo intent.
   */
  async registerMomo(input: RegisterMomoIntentInput): Promise<RegisterMomoIntentResult> {
    const existingByKey = await prisma.paymentIntent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existingByKey) {
      return {
        invoiceId: existingByKey.invoiceId,
        momoOrderId: existingByKey.momoOrderId,
        requestId: existingByKey.requestId,
        amount: toMoneyString(existingByKey.amount),
        expiresAt: formatVietnamDbDateTime(existingByKey.expiresAt) ?? input.expiresAt,
        status: 'pending',
        intentPersistence: 'mock_G9',
        payUrl: existingByKey.payUrl ?? undefined,
      };
    }

    const invoice = await invoiceRepository.findById(input.invoiceId);
    if (!invoice || invoice.status !== 'pending') {
      throw new AppError(400, 'INVOICE_NOT_PENDING', 'Hóa đơn không chờ thanh toán');
    }

    const dupOrder = await prisma.paymentIntent.findUnique({
      where: { momoOrderId: input.momoOrderId },
    });
    if (dupOrder) {
      throw new AppError(409, 'MOMO_ORDER_ALREADY_EXISTS', 'Mã đơn Momo đã tồn tại');
    }

    const expiresAt = toVietnamDbDateTime(new Date(input.expiresAt));

    const nowVn = toVietnamDbDateTime();
    await prisma.paymentIntent.create({
      data: {
        id: randomUUID(),
        invoiceId: input.invoiceId,
        momoOrderId: input.momoOrderId,
        requestId: input.requestId,
        amount: new Prisma.Decimal(input.amount),
        status: 'pending',
        payUrl: input.payUrl,
        expiresAt,
        idempotencyKey: input.idempotencyKey,
        paidAt: null,
        createdAt: nowVn,
        updatedAt: nowVn,
      },
    });

    // Chỉ gắn method/order — chưa paid, không set paidAt.
    await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        paymentMethod: 'momo',
        momoOrderId: input.momoOrderId,
        updatedAt: nowVn,
      },
    });

    return {
      invoiceId: input.invoiceId,
      momoOrderId: input.momoOrderId,
      requestId: input.requestId,
      amount: input.amount,
      expiresAt: formatVietnamDbDateTime(expiresAt) ?? input.expiresAt,
      status: 'pending',
      intentPersistence: 'mock_G9',
      payUrl: input.payUrl,
    };
  }
}

export const invoiceService = new InvoiceService();

// Wire ports cho Payment lane
setBillingSettlementPort(invoiceService);
setBillingPaymentIntentPort(invoiceService);
