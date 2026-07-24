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
  formatVietnamDbDateTime,
  getVietnamNowIso,
  toVietnamDbDateTime,
} from '../../../core/time/vietnamClock';
import { prisma } from '../../../core/prisma/prisma';
import { HI_RULE_SOURCE_DRAFT } from '../constants/invoice.constants';
import { invoiceRepository } from '../repositories/invoice.repository';
import type { InvoiceDto } from '../types/invoice.types';
import {
  benefitLevelToRateString,
  toMoneyString,
} from '../utils/money';

type BenefitLevel = 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100';
type RouteType = 'right_route' | 'referral' | 'emergency' | 'wrong_route';

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
      cardStatus: invoice.healthInsuranceBenefitLevel === 'NO_COVERAGE' ? 'none_or_expired' : 'valid',
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
      throw new AppError(
        400,
        'INVOICE_ALREADY_EXISTS',
        'Hồ sơ đã có hóa đơn đang chờ thanh toán',
      );
    }

    // Ép NO_COVERAGE nếu không có thẻ / hết hạn
    let benefitLevel = input.healthInsuranceBenefitLevel;
    const expiry = record.patient.healthInsuranceExpiryDate;
    const hasCard = Boolean(record.patient.healthInsuranceCode);
    const expired =
      expiry !== null && expiry !== undefined && expiry.getTime() < Date.now();
    if (!hasCard || expired) {
      benefitLevel = 'NO_COVERAGE';
    }

    const rateStr = benefitLevelToRateString(benefitLevel);
    const rate = new Prisma.Decimal(rateStr);

    const orders = await invoiceRepository.findServiceOrdersForRecord(input.recordId);
    if (orders.length === 0) {
      throw new AppError(
        400,
        'INCOMPLETE_COST_DATA',
        'Chưa có dịch vụ/chi phí để lập hóa đơn',
      );
    }

    const zero = new Prisma.Decimal(0);
    let subtotal = zero;
    let hiBase = zero;
    let hiDiscount = zero;

    const items = orders.map((order, index) => {
      const unitPrice = order.fee;
      const quantity = new Prisma.Decimal(1);
      const amount = unitPrice.mul(quantity);
      subtotal = subtotal.add(amount);

      // MVP: consultation covered when benefit > 0
      const covered = benefitLevel !== 'NO_COVERAGE';
      const eligible = covered ? amount : zero;
      const fund = covered ? eligible.mul(rate).toDecimalPlaces(2) : zero;
      const copay = amount.sub(fund);

      if (covered) {
        hiBase = hiBase.add(eligible);
        hiDiscount = hiDiscount.add(fund);
      }

      return {
        description: order.serviceCatalog.name,
        category: 'consultation' as const,
        quantity,
        unitPrice,
        amount,
        coveredByHealthInsurance: covered,
        healthInsuranceBenefitLevel: covered ? benefitLevel : null,
        healthInsuranceBenefitRateSnapshot: covered ? rateStr : null,
        healthInsuranceEligibleAmount: eligible,
        healthInsuranceCeilingAmount: eligible,
        healthInsuranceFundAmount: fund,
        patientCoPayAmount: copay,
        sortOrder: index,
      };
    });

    const totalAmount = subtotal.sub(hiDiscount).toDecimalPlaces(2);
    const advanceApplied = zero;
    const amountDue = totalAmount.sub(advanceApplied).toDecimalPlaces(2);

    if (amountDue.lt(0)) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Số tiền phải trả không hợp lệ');
    }

    const createClaim = hiDiscount.gt(0);

    const invoice = await invoiceRepository.createWithItems({
      recordId: input.recordId,
      healthInsuranceBenefitLevel: benefitLevel,
      healthInsuranceRouteType:
        benefitLevel === 'NO_COVERAGE' ? null : (input.healthInsuranceRouteType ?? null),
      healthInsuranceBenefitRateSnapshot: rateStr,
      healthInsuranceRuleSource: HI_RULE_SOURCE_DRAFT,
      subtotal,
      healthInsuranceBaseAmount: hiBase,
      healthInsuranceDiscountAmount: hiDiscount,
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
      metadata: { recordId: input.recordId, amountDue: toMoneyString(amountDue) },
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
            paymentMethod: (invoice.paymentMethod ?? input.method) as 'cash' | 'momo',
            status: 'paid',
            receiptNumber: invoice.receiptNumber ?? '',
            paidAt: formatVietnamDbDateTime(backfill) ?? getVietnamNowIso(),
            amountDue: toMoneyString(invoice.amountDue),
            version: invoice.version,
          };
        }
        return {
          invoiceId: invoice.id,
          paymentMethod: (invoice.paymentMethod ?? input.method) as 'cash' | 'momo',
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
    const paidAt = toVietnamDbDateTime(
      input.paidAt ? new Date(input.paidAt) : new Date(),
    );
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
