import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/prisma/prisma';
import { toVietnamDbDateTime } from '../../../core/time/vietnam-clock';

/**
 * Truy cập dữ liệu tạm ứng và giữ các phép tính số dư ở sát transaction database.
 */
export class PaymentAdvanceRepository {
  async findRecordForAdvance(recordId: string) {
    return prisma.medicalRecord.findUnique({
      where: { id: recordId, deletedAt: null },
      select: {
        id: true,
        bedId: true,
        treatmentType: true,
        department: { select: { name: true } },
      },
    });
  }

  async listByRecordId(recordId: string, skip: number, take: number) {
    return prisma.paymentAdvance.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countByRecordId(recordId: string) {
    return prisma.paymentAdvance.count({ where: { recordId } });
  }

  async calculateBalance(recordId: string, client: Prisma.TransactionClient = prisma) {
    const [deposits, refunds, finalInvoice] = await Promise.all([
      client.paymentAdvance.aggregate({
        where: { recordId, type: 'deposit' },
        _sum: { amount: true },
      }),
      client.paymentAdvance.aggregate({
        where: { recordId, type: 'refund' },
        _sum: { amount: true },
      }),
      client.invoice.aggregate({
        where: { recordId, status: { in: ['pending', 'paid', 'write_off'] } },
        _sum: { advanceAppliedAmount: true },
      }),
    ]);

    const totalDeposited = deposits._sum.amount ?? new Prisma.Decimal(0);
    const totalRefunded = refunds._sum.amount ?? new Prisma.Decimal(0);
    const appliedAdvance = finalInvoice._sum.advanceAppliedAmount ?? new Prisma.Decimal(0);
    const balance = totalDeposited.sub(totalRefunded).sub(appliedAdvance);

    return {
      totalDeposited,
      totalRefunded,
      balance: balance.lt(0) ? new Prisma.Decimal(0) : balance,
    };
  }

  async createDeposit(params: {
    recordId: string;
    amount: Prisma.Decimal;
    method: 'cash' | 'momo';
    reason?: string;
  }) {
    const createdAt = toVietnamDbDateTime();
    const receiptNumber = params.method === 'cash' ? await this.nextReceiptNumber('AD') : null;

    return prisma.paymentAdvance.create({
      data: {
        id: randomUUID(),
        recordId: params.recordId,
        type: 'deposit',
        amount: params.amount,
        method: params.method,
        reason: params.reason ?? null,
        receiptNumber,
        createdAt,
      },
    });
  }

  /**
   * Tạo refund cùng lúc với lần đọc số dư để giảm race condition giữa hai yêu cầu hoàn tiền.
   */
  async createRefundIfWithinBalance(params: {
    recordId: string;
    amount: Prisma.Decimal;
    reason: string;
    method: 'cash' | 'momo';
  }) {
    return prisma.$transaction(async (tx) => {
      // Khóa dòng hồ sơ để hai yêu cầu hoàn tiền đồng thời không cùng đọc một số dư cũ.
      // Prisma không có API row-lock portable; câu lệnh raw vẫn được parameterize qua Prisma.sql.
      await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id
        FROM medical_records
        WHERE id = ${params.recordId}
        FOR UPDATE
      `);

      const balance = await this.calculateBalance(params.recordId, tx);
      if (params.amount.gt(balance.balance)) {
        return { created: null, balance };
      }

      const createdAt = toVietnamDbDateTime();
      const receiptNumber =
        params.method === 'cash' ? await this.nextReceiptNumber('AR', tx) : null;
      const created = await tx.paymentAdvance.create({
        data: {
          id: randomUUID(),
          recordId: params.recordId,
          type: 'refund',
          amount: params.amount,
          method: params.method,
          reason: params.reason,
          receiptNumber,
          createdAt,
        },
      });

      return { created, balance };
    });
  }

  private async nextReceiptNumber(prefix: string, client: Prisma.TransactionClient = prisma) {
    const sequence = await client.codeSequence.upsert({
      where: { key: `receipt_${prefix}` },
      create: { key: `receipt_${prefix}`, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    return `${prefix}-${datePart}-${String(sequence.lastNumber).padStart(3, '0')}`;
  }
}

export const paymentAdvanceRepository = new PaymentAdvanceRepository();
