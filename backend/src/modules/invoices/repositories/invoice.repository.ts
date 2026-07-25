import type {
  HealthInsuranceBenefitLevel,
  HealthInsuranceRouteType,
  InvoiceStatus,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/prisma/prisma';
import { toVietnamDbDateTime } from '../../../core/time/vietnamClock';

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

  async list(params: {
    recordId?: string;
    status?: InvoiceStatus;
    skip: number;
    take: number;
  }) {
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
              patient: {
                select: { patientCode: true, fullName: true },
              },
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
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
      // Wall-clock VN (cùng pattern queue) — Workbench hiển thị đúng giờ VN, không lệch UTC.
      const nowVn = toVietnamDbDateTime();
      const invoice = await tx.invoice.create({
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
          advanceAppliedAmount: params.advanceAppliedAmount,
          amountDue: params.amountDue,
          statementStatus: 'draft',
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
    return prisma.serviceOrder.findMany({
      where: { recordId, status: { not: 'cancelled' } },
      include: {
        serviceCatalog: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
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
      data: { status: 'closed' },
    });
  }
}

export const invoiceRepository = new InvoiceRepository();
