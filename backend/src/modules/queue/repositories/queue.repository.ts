import type { Prisma, QueueTicket, QueueTicketStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { prisma } from '../../../core/prisma/prisma';
import { toVietnamDbDateTime } from '../../../core/time/vietnamClock';

/**
 * Prisma access cho queue tickets / daily sequence.
 */
export class QueueRepository {
  /**
   * Cấp số + tạo ticket trong 1 transaction (không nhảy số).
   * createdAt ghi wall-clock VN để khớp thời gian thực tế trên DB/Workbench.
   */
  async createTicketWithAllocatedNumber(date: Date, _source: string): Promise<QueueTicket> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.queueDailySequence.findUnique({
        where: { date },
        select: { lastNumber: true },
      });

      let nextNumber = 1;
      if (!existing) {
        // Đồng bộ max hiện có trong ngày (nếu đã có ticket trước khi có sequence).
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

  async callNextWaiting(date: Date, calledAt: Date): Promise<QueueTicket | null> {
    return prisma.$transaction(async (tx) => {
      const waiting = await tx.queueTicket.findFirst({
        where: { date, status: 'waiting' },
        orderBy: { number: 'asc' },
      });

      if (!waiting) {
        return null;
      }

      return tx.queueTicket.update({
        where: { id: waiting.id },
        data: { status: 'called', calledAt },
      });
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
