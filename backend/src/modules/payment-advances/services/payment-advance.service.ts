import { Prisma } from '@prisma/client';

import { AppError } from '../../../core/errors/app-error';
import { auditPort } from '../../../core/ports/audit-port';
import { toMoneyString } from '../../invoices/utils/money';
import { paymentAdvanceRepository } from '../repositories/payment-advance.repository';
import type { PaymentAdvanceDto, PaymentAdvanceSummaryDto } from '../types/payment-advance.types';

type AdvanceRecordLocation = {
  treatmentType: 'outpatient' | 'inpatient' | null;
  bedId: string | null;
  department: { name: string } | null;
};

const isInpatientRecord = (record: AdvanceRecordLocation | null) =>
  Boolean(
    record &&
    (record.treatmentType === 'inpatient' ||
      record.bedId ||
      record.department?.name.toLocaleLowerCase('vi-VN').includes('nội trú')),
  );

function toAdvanceDto(advance: {
  id: string;
  type: 'deposit' | 'refund';
  amount: Prisma.Decimal;
  method: 'cash' | 'momo';
  reason: string | null;
  receiptNumber: string | null;
  createdAt: Date;
}): PaymentAdvanceDto {
  return {
    id: advance.id,
    type: advance.type,
    amount: toMoneyString(advance.amount),
    method: advance.method,
    reason: advance.reason,
    receiptNumber: advance.receiptNumber,
    createdAt: advance.createdAt.toISOString(),
  };
}

/**
 * Nghiệp vụ tạm ứng nội trú: kiểm tra hồ sơ, lưu giao dịch, tính số dư và audit thao tác tiền.
 */
export class PaymentAdvanceService {
  async createDeposit(input: {
    recordId: string;
    amountVnd: number;
    method: 'cash' | 'momo';
    reason?: string;
    actorUserId?: string;
  }): Promise<PaymentAdvanceDto> {
    this.assertActor(input.actorUserId);
    await this.assertInpatientRecord(input.recordId);

    const created = await paymentAdvanceRepository.createDeposit({
      recordId: input.recordId,
      amount: new Prisma.Decimal(input.amountVnd),
      method: input.method,
      reason: input.reason,
    });
    await auditPort.record({
      action: 'payment_advance.deposit',
      resource: 'PaymentAdvance',
      resourceId: created.id,
      userId: input.actorUserId,
      metadata: { recordId: input.recordId, method: input.method },
    });
    return toAdvanceDto(created);
  }

  async createRefund(input: {
    recordId: string;
    amountVnd: number;
    method: 'cash' | 'momo';
    reason: string;
    actorUserId?: string;
  }): Promise<PaymentAdvanceDto> {
    this.assertActor(input.actorUserId);
    await this.assertInpatientRecord(input.recordId);

    const result = await paymentAdvanceRepository.createRefundIfWithinBalance({
      recordId: input.recordId,
      amount: new Prisma.Decimal(input.amountVnd),
      method: input.method,
      reason: input.reason,
    });
    if (!result.created) {
      throw new AppError(
        400,
        'REFUND_EXCEEDS_BALANCE',
        'Số tiền hoàn trả vượt quá số dư tạm ứng hiện có.',
      );
    }

    await auditPort.record({
      action: 'payment_advance.refund',
      resource: 'PaymentAdvance',
      resourceId: result.created.id,
      userId: input.actorUserId,
      metadata: { recordId: input.recordId, method: input.method },
    });
    return toAdvanceDto(result.created);
  }

  async list(input: {
    recordId: string;
    page: number;
    pageSize: number;
    actorUserId?: string;
  }): Promise<
    PaymentAdvanceSummaryDto & {
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }
  > {
    this.assertActor(input.actorUserId);
    await this.assertInpatientRecord(input.recordId);
    const skip = (input.page - 1) * input.pageSize;
    const [items, totalItems, balance] = await Promise.all([
      paymentAdvanceRepository.listByRecordId(input.recordId, skip, input.pageSize),
      paymentAdvanceRepository.countByRecordId(input.recordId),
      paymentAdvanceRepository.calculateBalance(input.recordId),
    ]);

    return {
      items: items.map(toAdvanceDto),
      totalDeposited: toMoneyString(balance.totalDeposited),
      totalRefunded: toMoneyString(balance.totalRefunded),
      balance: toMoneyString(balance.balance),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
      },
    };
  }

  private async assertInpatientRecord(recordId: string) {
    const record = await paymentAdvanceRepository.findRecordForAdvance(recordId);
    if (!record) {
      throw new AppError(404, 'RECORD_NOT_FOUND', 'Không tìm thấy hồ sơ bệnh án');
    }
    if (!isInpatientRecord(record)) {
      throw new AppError(
        400,
        'ADVANCE_ONLY_FOR_INPATIENT',
        'Tạm ứng chỉ áp dụng cho hồ sơ điều trị nội trú.',
      );
    }
    return record;
  }

  private assertActor(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập để thao tác tạm ứng');
    }
  }
}

export const paymentAdvanceService = new PaymentAdvanceService();

export { isInpatientRecord };
