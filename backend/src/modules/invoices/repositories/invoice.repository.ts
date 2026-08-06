import {
  Prisma,
  type HealthInsuranceBenefitLevel,
  type HealthInsuranceRouteType,
  type InvoiceStatus,
  type PaymentMethod,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/prisma/prisma';
import { toVietnamDbDateTime } from '../../../core/time/vietnam-clock';

export type CreateInvoiceItemInput = {
  description: string;
  category: 'consultation' | 'lab' | 'medicine' | 'bed' | 'procedure' | 'other';
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  amount: Prisma.Decimal;
  coveredByHealthInsurance: boolean;
  healthInsuranceBenefitLevel?: HealthInsuranceBenefitLevel | null;
  healthInsuranceBenefitRateSnapshot?: string | null;
  healthInsuranceEligibleAmount: Prisma.Decimal;
  healthInsuranceCeilingAmount: Prisma.Decimal;
  healthInsuranceFundAmount: Prisma.Decimal;
  patientCoPayAmount: Prisma.Decimal;
  sortOrder: number;
};

/**
 * Prisma access cho invoices.
 */
export class InvoiceRepository {
  async findById(invoiceId: string) {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        claim: true,
        medicalRecord: {
          select: {
            id: true,
            recordCode: true,
            status: true,
            isEmergency: true,
            patientId: true,
            treatmentType: true,
            bedId: true,
            department: { select: { name: true } },
            patient: {
              select: {
                id: true,
                patientCode: true,
                fullName: true,
                healthInsuranceCode: true,
                healthInsuranceExpiryDate: true,
              },
            },
          },
        },
      },
    });
  }

  async findPendingByRecordId(recordId: string) {
    return prisma.invoice.findFirst({
      where: { recordId, status: 'pending' },
      select: { id: true },
    });
  }

  async list(params: { recordId?: string; status?: InvoiceStatus; skip: number; take: number }) {
    const where: Prisma.InvoiceWhereInput = {
      ...(params.recordId ? { recordId: params.recordId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          claim: true,
          medicalRecord: {
            select: {
              id: true,
              recordCode: true,
              status: true,
              isEmergency: true,
              patientId: true,
              treatmentType: true,
              bedId: true,
              department: { select: { name: true } },
              patient: {
                select: {
                  id: true,
                  patientCode: true,
                  fullName: true,
                  healthInsuranceCode: true,
                  healthInsuranceExpiryDate: true,
                },
              },
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Lấy hồ sơ có dịch vụ chưa hủy và chưa có hóa đơn pending để kế toán lập hóa đơn mới.
   * Chỉ trả các trường cần cho màn kế toán, không đẩy toàn bộ bệnh án ra client.
   */
  async listInvoiceCandidates(params: { skip: number; take: number }) {
    const where: Prisma.MedicalRecordWhereInput = {
      deletedAt: null,
      status: { not: 'closed' },
      serviceOrders: { some: { status: { not: 'cancelled' } } },
      invoices: { none: { status: 'pending' } },
    };

    const [items, total] = await prisma.$transaction([
      prisma.medicalRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        select: {
          id: true,
          recordCode: true,
          treatmentType: true,
          bedId: true,
          isEmergency: true,
          createdAt: true,
          department: { select: { name: true } },
          patient: {
            select: {
              id: true,
              patientCode: true,
              fullName: true,
              dateOfBirth: true,
              gender: true,
              phoneNumber: true,
              identityCardNumber: true,
              healthInsuranceCode: true,
              healthInsuranceExpiryDate: true,
            },
          },
          serviceOrders: {
            where: { status: { not: 'cancelled' } },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              fee: true,
              serviceCatalog: { select: { code: true, name: true } },
            },
          },
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return { items, total };
  }

  async createWithItems(params: {
    recordId: string;
    healthInsuranceBenefitLevel: HealthInsuranceBenefitLevel;
    healthInsuranceRouteType: HealthInsuranceRouteType | null;
    healthInsuranceBenefitRateSnapshot: string;
    healthInsuranceRuleSource: string;
    subtotal: Prisma.Decimal;
    healthInsuranceBaseAmount: Prisma.Decimal;
    healthInsuranceDiscountAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    advanceAppliedAmount: Prisma.Decimal;
    amountDue: Prisma.Decimal;
    items: CreateInvoiceItemInput[];
    createClaim: boolean;
  }) {
    const invoiceId = randomUUID();

    return prisma.$transaction(async (tx) => {
      // Khóa hồ sơ trong lúc tính và áp dụng tạm ứng để hai yêu cầu đồng thời
      // không cùng sử dụng một số dư.
      await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id
        FROM medical_records
        WHERE id = ${params.recordId}
        FOR UPDATE
      `);

      const [deposits, refunds, activeInvoices] = await Promise.all([
        tx.paymentAdvance.aggregate({
          where: { recordId: params.recordId, type: 'deposit' },
          _sum: { amount: true },
        }),
        tx.paymentAdvance.aggregate({
          where: { recordId: params.recordId, type: 'refund' },
          _sum: { amount: true },
        }),
        tx.invoice.aggregate({
          where: {
            recordId: params.recordId,
            status: { in: ['pending', 'paid', 'write_off'] },
          },
          _sum: { advanceAppliedAmount: true },
        }),
      ]);
      const deposited = deposits._sum.amount ?? new Prisma.Decimal(0);
      const refunded = refunds._sum.amount ?? new Prisma.Decimal(0);
      const alreadyApplied = activeInvoices._sum.advanceAppliedAmount ?? new Prisma.Decimal(0);
      const availableAdvance = deposited.sub(refunded).sub(alreadyApplied);
      const advanceAppliedAmount = availableAdvance.lte(0)
        ? new Prisma.Decimal(0)
        : (availableAdvance.lt(params.totalAmount) ? availableAdvance : params.totalAmount)
            .toDecimalPlaces(2);
      const amountDue = params.totalAmount.sub(advanceAppliedAmount).toDecimalPlaces(2);

      // Wall-clock VN (cùng pattern queue) — Workbench hiển thị đúng giờ VN, không lệch UTC.
      const nowVn = toVietnamDbDateTime();
      await tx.invoice.create({
        data: {
          id: invoiceId,
          recordId: params.recordId,
          status: 'pending',
          healthInsuranceBenefitLevel: params.healthInsuranceBenefitLevel,
          healthInsuranceRouteType: params.healthInsuranceRouteType,
          healthInsuranceBenefitRateSnapshot: params.healthInsuranceBenefitRateSnapshot,
          healthInsuranceRuleSource: params.healthInsuranceRuleSource,
          subtotal: params.subtotal,
          healthInsuranceBaseAmount: params.healthInsuranceBaseAmount,
          healthInsuranceDiscountAmount: params.healthInsuranceDiscountAmount,
          totalAmount: params.totalAmount,
          advanceAppliedAmount,
          amountDue,
          statementStatus: 'issued',
          statementNumber: `BK-${invoiceId.slice(0, 8).toUpperCase()}`,
          version: 1,
          createdAt: nowVn,
          updatedAt: nowVn,
          items: {
            create: params.items.map((item) => ({
              id: randomUUID(),
              description: item.description,
              category: item.category,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              coveredByHealthInsurance: item.coveredByHealthInsurance,
              healthInsuranceBenefitLevel: item.healthInsuranceBenefitLevel ?? null,
              healthInsuranceBenefitRateSnapshot: item.healthInsuranceBenefitRateSnapshot ?? null,
              healthInsuranceEligibleAmount: item.healthInsuranceEligibleAmount,
              healthInsuranceCeilingAmount: item.healthInsuranceCeilingAmount,
              healthInsuranceFundAmount: item.healthInsuranceFundAmount,
              patientCoPayAmount: item.patientCoPayAmount,
              sortOrder: item.sortOrder,
              createdAt: nowVn,
            })),
          },
        },
        include: { items: true, claim: true },
      });

      if (params.createClaim) {
        await tx.healthInsuranceClaim.create({
          data: {
            id: randomUUID(),
            invoiceId,
            status: 'draft',
            createdAt: nowVn,
            updatedAt: nowVn,
          },
        });
      }

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          claim: true,
          medicalRecord: {
            select: {
              id: true,
              recordCode: true,
              status: true,
              isEmergency: true,
              patientId: true,
              treatmentType: true,
              bedId: true,
              department: { select: { name: true } },
              patient: {
                select: {
                  id: true,
                  patientCode: true,
                  fullName: true,
                  healthInsuranceCode: true,
                  healthInsuranceExpiryDate: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Chốt paid — luôn ghi paidAt (wall-clock VN).
   * Fallback nếu version lệch nhưng vẫn pending; backfill paidAt nếu đã paid mà thiếu.
   */
  async markPaid(params: {
    invoiceId: string;
    expectedVersion: number;
    method: PaymentMethod;
    receiptNumber: string;
    paidAt: Date;
    momoOrderId?: string;
  }) {
    const paidAt = params.paidAt ?? toVietnamDbDateTime();
    const payData = {
      status: 'paid' as const,
      paymentMethod: params.method,
      receiptNumber: params.receiptNumber,
      paidAt,
      momoOrderId: params.momoOrderId,
      updatedAt: paidAt,
    };

    let result = await prisma.invoice.updateMany({
      where: {
        id: params.invoiceId,
        status: 'pending',
        version: params.expectedVersion,
      },
      data: {
        ...payData,
        version: { increment: 1 },
      },
    });

    // Version drift — vẫn pending
    if (result.count === 0) {
      result = await prisma.invoice.updateMany({
        where: { id: params.invoiceId, status: 'pending' },
        data: {
          ...payData,
          version: { increment: 1 },
        },
      });
    }

    if (result.count === 0) {
      const existing = await this.findById(params.invoiceId);
      if (existing?.status === 'paid') {
        if (!existing.paidAt) {
          await prisma.invoice.update({
            where: { id: params.invoiceId },
            data: {
              paidAt,
              updatedAt: paidAt,
              paymentMethod: existing.paymentMethod ?? params.method,
              receiptNumber: existing.receiptNumber ?? params.receiptNumber,
              momoOrderId: existing.momoOrderId ?? params.momoOrderId,
            },
          });
        }
        return this.findById(params.invoiceId);
      }
      return null;
    }

    // Đảm bảo paidAt đã ghi (một số driver/ORM edge case)
    await prisma.invoice.update({
      where: { id: params.invoiceId },
      data: { paidAt, updatedAt: paidAt },
    });

    return this.findById(params.invoiceId);
  }

  async cancelPending(params: {
    invoiceId: string;
    expectedVersion: number;
    cancelReason: string;
    cancelledAt: Date;
  }) {
    const cancelledAt = params.cancelledAt ?? toVietnamDbDateTime();
    const result = await prisma.invoice.updateMany({
      where: {
        id: params.invoiceId,
        status: 'pending',
        version: params.expectedVersion,
      },
      data: {
        status: 'cancelled',
        cancelReason: params.cancelReason,
        cancelledAt,
        version: { increment: 1 },
        updatedAt: cancelledAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    await prisma.healthInsuranceClaim.updateMany({
      where: { invoiceId: params.invoiceId, status: 'draft' },
      data: {
        status: 'voided',
        voidReason: 'invoice_cancelled',
        voidedAt: cancelledAt,
        updatedAt: cancelledAt,
      },
    });

    return this.findById(params.invoiceId);
  }

  /**
   * Chuyển hóa đơn pending sang write-off và lưu phê duyệt trong cùng transaction.
   * Điều kiện version giúp tránh ghi đè thao tác thanh toán/hủy vừa phát sinh.
   */
  async writeOffEmergency(params: {
    invoiceId: string;
    expectedVersion: number;
    writeOffReason: string;
    approvedByUserId: string;
    approvedAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.updateMany({
        where: {
          id: params.invoiceId,
          status: 'pending',
          version: params.expectedVersion,
          medicalRecord: { isEmergency: true },
        },
        data: {
          status: 'write_off',
          writeOffReason: params.writeOffReason,
          writeOffAt: params.approvedAt,
          version: { increment: 1 },
          updatedAt: params.approvedAt,
        },
      });

      if (updated.count !== 1) return null;

      await tx.emergencyWriteOffApproval.create({
        data: {
          id: randomUUID(),
          invoiceId: params.invoiceId,
          recordId: (
            await tx.invoice.findUniqueOrThrow({
              where: { id: params.invoiceId },
              select: { recordId: true },
            })
          ).recordId,
          approvedInvoiceVersion: params.expectedVersion,
          approvedByUserId: params.approvedByUserId,
          writeOffReason: params.writeOffReason,
          approvedAt: params.approvedAt,
        },
      });

      return tx.invoice.findUniqueOrThrow({
        where: { id: params.invoiceId },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          claim: true,
          medicalRecord: {
            select: {
              id: true,
              recordCode: true,
              status: true,
              isEmergency: true,
              patientId: true,
              treatmentType: true,
              bedId: true,
              department: { select: { name: true } },
              patient: {
                select: {
                  id: true,
                  patientCode: true,
                  fullName: true,
                  healthInsuranceCode: true,
                  healthInsuranceExpiryDate: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async nextReceiptNumber(prefix: string): Promise<string> {
    const key = `receipt_${prefix}`;
    const row = await prisma.codeSequence.upsert({
      where: { key },
      create: { key, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const n = String(row.lastNumber).padStart(3, '0');
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${prefix}-${y}${m}${d}-${n}`;
  }

  async findServiceOrdersForRecord(recordId: string) {
    // Dùng raw query có tham số để đọc thêm cấu hình BHYT ngay cả khi client Prisma
    // đang chạy từ bản sinh trước migration; không ghép chuỗi từ input người dùng.
    return prisma.$queryRaw<
      Array<{
        id: string;
        fee: Prisma.Decimal;
        service_catalog_id: string;
        service_catalog_name: string;
        service_catalog_code: string;
        covered_by_health_insurance: boolean | number;
        health_insurance_ceiling_price: Prisma.Decimal | null;
      }>
    >(Prisma.sql`
      SELECT
        so.id AS id,
        so.fee AS fee,
        sc.id AS service_catalog_id,
        sc.name AS service_catalog_name,
        sc.code AS service_catalog_code,
        sc.covered_by_health_insurance AS covered_by_health_insurance,
        sc.health_insurance_ceiling_price AS health_insurance_ceiling_price
      FROM service_orders so
      INNER JOIN service_catalog sc ON sc.id = so.serviceCatalogId
      WHERE so.recordId = ${recordId}
        AND so.status <> 'cancelled'
      ORDER BY so.createdAt ASC
    `).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        fee: row.fee,
        serviceCatalog: {
          id: row.service_catalog_id,
          name: row.service_catalog_name,
          code: row.service_catalog_code,
          coveredByHealthInsurance: Boolean(row.covered_by_health_insurance),
          healthInsuranceCeilingPrice: row.health_insurance_ceiling_price,
        },
      })),
    );
  }

  async findMedicalRecord(recordId: string) {
    return prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true,
            healthInsuranceCode: true,
            healthInsuranceExpiryDate: true,
          },
        },
      },
    });
  }

  async closeRecordIfOpen(recordId: string) {
    await prisma.medicalRecord.updateMany({
      where: { id: recordId, status: { not: 'closed' } },
      data: { status: 'closed', version: { increment: 1 } },
    });
  }
}

export const invoiceRepository = new InvoiceRepository();
