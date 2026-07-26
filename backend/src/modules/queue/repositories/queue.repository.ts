import { Prisma, type QueueTicket, type QueueTicketStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/prisma/prisma';
import { toVietnamDbDateTime } from '../../../core/time/vietnamClock';

const MAX_SEQUENCE_ALLOCATION_ATTEMPTS = 2;

/**
 * Prisma access cho queue tickets / daily sequence.
 */
export class QueueRepository {
  /**
   * Cấp số + tạo ticket trong một transaction.
   * Retry ngắn xử lý race khi nhiều worker cùng tạo sequence đầu ngày.
   */
  async createTicketWithAllocatedNumber(date: Date, _source: string): Promise<QueueTicket> {
    for (let attempt = 1; attempt <= MAX_SEQUENCE_ALLOCATION_ATTEMPTS; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const existing = await tx.queueDailySequence.findUnique({
            where: { date },
            select: { lastNumber: true },
          });

          let nextNumber = 1;
          if (!existing) {
            // Đồng bộ max hiện có nếu ticket đã tồn tại trước khi sequence được tạo.
            const agg = await tx.queueTicket.aggregate({
              where: { date },
              _max: { number: true },
            });
            nextNumber = (agg._max.number ?? 0) + 1;
            await tx.queueDailySequence.create({
              data: { date, lastNumber: nextNumber },
            });
          } else {
            const updated = await tx.queueDailySequence.update({
              where: { date },
              data: { lastNumber: { increment: 1 } },
              select: { lastNumber: true },
            });
            nextNumber = updated.lastNumber;
          }

          const createdAt = toVietnamDbDateTime();

          return tx.queueTicket.create({
            data: {
              id: randomUUID(),
              number: nextNumber,
              date,
              status: 'waiting',
              createdAt,
            },
          });
        });
      } catch (error) {
        if (!this.isUniqueConflict(error) || attempt === MAX_SEQUENCE_ALLOCATION_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('QUEUE_SEQUENCE_ALLOCATION_FAILED');
  }

  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  async findById(ticketId: string): Promise<QueueTicket | null> {
    return prisma.queueTicket.findUnique({
      where: { id: ticketId },
    });
  }

  async findMany(params: {
    date: Date;
    status?: QueueTicketStatus;
    skip: number;
    take: number;
  }): Promise<{ items: QueueTicket[]; total: number }> {
    const where: Prisma.QueueTicketWhereInput = {
      date: params.date,
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.queueTicket.findMany({
        where,
        orderBy: { number: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.queueTicket.count({ where }),
    ]);

    return { items, total };
  }

  async updateStatus(
    ticketId: string,
    data: Prisma.QueueTicketUpdateInput,
  ): Promise<QueueTicket> {
    return prisma.queueTicket.update({
      where: { id: ticketId },
      data,
    });
  }

  /**
   * Gọi số waiting nhỏ nhất theo FIFO và tránh race giữa nhiều quầy.
   */
  async callNextWaiting(
    date: Date,
    calledAt: Date,
  ): Promise<QueueTicket | null | 'race'> {
    return prisma.$transaction(async (tx) => {
      const waiting = await tx.queueTicket.findFirst({
        where: { date, status: 'waiting' },
        orderBy: { number: 'asc' },
      });

      if (!waiting) {
        return null;
      }

      const updated = await tx.queueTicket.updateMany({
        where: { id: waiting.id, status: 'waiting' },
        data: { status: 'called', calledAt },
      });

      if (updated.count === 0) {
        return 'race';
      }

      return tx.queueTicket.findUniqueOrThrow({
        where: { id: waiting.id },
      });
    });
  }

  /**
   * Mark served khi tiếp nhận xong, chỉ chấp nhận ticket đang called.
   */
  async markServed(params: {
    ticketId: string;
    servedAt: Date;
    recordId?: string;
  }): Promise<QueueTicket | null | 'invalid'> {
    const existing = await prisma.queueTicket.findUnique({
      where: { id: params.ticketId },
    });

    if (!existing) {
      return null;
    }

    if (existing.status !== 'called') {
      return 'invalid';
    }

    const updated = await prisma.queueTicket.updateMany({
      where: { id: params.ticketId, status: 'called' },
      data: {
        status: 'served',
        servedAt: params.servedAt,
        ...(params.recordId ? { recordId: params.recordId } : {}),
      },
    });

    if (updated.count === 0) {
      return 'invalid';
    }

    return prisma.queueTicket.findUniqueOrThrow({
      where: { id: params.ticketId },
    });
  }

  async findCurrentlyCalled(date: Date): Promise<QueueTicket[]> {
    return prisma.queueTicket.findMany({
      where: { date, status: 'called' },
      orderBy: { calledAt: 'desc' },
      take: 5,
    });
  }

  async findRecentlyServedNumbers(date: Date, limit = 10): Promise<number[]> {
    const rows = await prisma.queueTicket.findMany({
      where: { date, status: 'served' },
      orderBy: { servedAt: 'desc' },
      take: limit,
      select: { number: true },
    });
    return rows.map((row) => row.number);
  }
}

export const queueRepository = new QueueRepository();
