import type { QueueTicket, QueueTicketStatus } from '@prisma/client';

import { AppError } from '../../../core/errors/appError';
import { auditPort } from '../../../core/ports/auditPort';
import { realtimePort } from '../../../core/ports/realtimePort';
import {
  formatDateOnly,
  formatVietnamDbDateTime,
  getVietnamLegalDate,
  getVietnamLegalDateString,
  getVietnamNowIso,
  parseLegalDateString,
  toVietnamDbDateTime,
} from '../../../core/time/vietnamClock';
import { QUEUE_RECEIPT, QUEUE_SOURCE } from '../constants/queue.constants';
import { queueRepository } from '../repositories/queue.repository';
import type {
  IssuedTicketDto,
  PublicQueueDisplayDto,
  QueueTicketDto,
  ReprintTicketDto,
} from '../types/queue.types';

/** Sprint 1 non-durable idempotency (G9). */
const issueIdempotencyCache = new Map<string, IssuedTicketDto>();

/**
 * Map entity → public/staff DTO (không PII).
 */
function toTicketDto(ticket: QueueTicket): QueueTicketDto {
  return {
    ticketId: ticket.id,
    number: ticket.number,
    date: formatDateOnly(ticket.date),
    status: ticket.status,
    calledAt: formatVietnamDbDateTime(ticket.calledAt),
    servedAt: formatVietnamDbDateTime(ticket.servedAt),
  };
}

function toIssuedDto(ticket: QueueTicket): IssuedTicketDto {
  return {
    ticketId: ticket.id,
    number: ticket.number,
    date: formatDateOnly(ticket.date),
    status: 'waiting',
    receipt: {
      systemName: QUEUE_RECEIPT.systemName,
      ticketType: QUEUE_RECEIPT.ticketType,
      issuedAt: formatVietnamDbDateTime(ticket.createdAt) ?? getVietnamNowIso(),
      instruction: QUEUE_RECEIPT.instruction,
    },
  };
}

function resolveDate(dateStr?: string): { date: Date; dateString: string } {
  if (!dateStr) {
    const date = getVietnamLegalDate();
    return { date, dateString: getVietnamLegalDateString() };
  }

  try {
    const date = parseLegalDateString(dateStr);
    return { date, dateString: dateStr };
  } catch {
    throw new AppError(400, 'INVALID_DATE', 'Ngày không hợp lệ (YYYY-MM-DD)');
  }
}

async function publishTicketEvent(
  eventName: 'queue.ticket.called' | 'queue.ticket.updated',
  ticket: QueueTicket,
): Promise<void> {
  const dateString = formatDateOnly(ticket.date);
  await realtimePort.publishQueue({
    eventName,
    date: dateString,
    payload: {
      ticketId: ticket.id,
      number: ticket.number,
      status: ticket.status,
      calledAt: formatVietnamDbDateTime(ticket.calledAt),
      date: dateString,
    },
  });
}

/**
 * Nghiệp vụ hàng đợi — issue / call / skip / recall / display.
 */
export class QueueService {
  /**
   * Kiosk / desk cấp số waiting (atomic, idempotent in-process).
   */
  async issueTicket(params: {
    idempotencyKey: string;
    source?: string;
  }): Promise<IssuedTicketDto> {
    const cached = issueIdempotencyCache.get(params.idempotencyKey);
    if (cached) {
      return cached;
    }

    try {
      const date = getVietnamLegalDate();
      const ticket = await queueRepository.createTicketWithAllocatedNumber(
        date,
        params.source ?? QUEUE_SOURCE.KIOSK,
      );
      const dto = toIssuedDto(ticket);
      issueIdempotencyCache.set(params.idempotencyKey, dto);

      await publishTicketEvent('queue.ticket.updated', ticket);
      return dto;
    } catch {
      throw new AppError(
        409,
        'QUEUE_ALLOCATION_CONFLICT',
        'Không cấp được số thứ tự. Vui lòng thử lại.',
      );
    }
  }

  /**
   * In lại phiếu — không tạo số mới.
   */
  async reprintTicket(ticketId: string): Promise<ReprintTicketDto> {
    const ticket = await queueRepository.findById(ticketId);
    if (!ticket) {
      throw new AppError(404, 'QUEUE_TICKET_NOT_FOUND', 'Không tìm thấy số thứ tự');
    }

    return {
      ticketId: ticket.id,
      number: ticket.number,
      date: formatDateOnly(ticket.date),
      renderData: {
        systemName: QUEUE_RECEIPT.systemName,
        ticketType: QUEUE_RECEIPT.ticketType,
      },
    };
  }

  /**
   * Snapshot LED public — zero PII.
   */
  async getPublicDisplay(dateStr?: string): Promise<PublicQueueDisplayDto> {
    const { date, dateString } = resolveDate(dateStr);
    const currentlyCalled = await queueRepository.findCurrentlyCalled(date);
    const recentlyServedNumbers = await queueRepository.findRecentlyServedNumbers(date, 10);

    return {
      date: dateString,
      currentlyCalled: currentlyCalled.map((ticket) => ({
        ticketId: ticket.id,
        number: ticket.number,
        calledAt: formatVietnamDbDateTime(ticket.calledAt),
      })),
      recentlyServedNumbers,
    };
  }

  /**
   * Danh sách ticket theo ngày/status (staff).
   */
  async listTickets(params: {
    date: string;
    status?: QueueTicketStatus;
    page: number;
    pageSize: number;
  }): Promise<{
    data: QueueTicketDto[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const { date } = resolveDate(params.date);
    const skip = (params.page - 1) * params.pageSize;
    const { items, total } = await queueRepository.findMany({
      date,
      status: params.status,
      skip,
      take: params.pageSize,
    });

    return {
      data: items.map(toTicketDto),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      },
    };
  }

  /**
   * Gọi số waiting nhỏ nhất → called.
   */
  async callNext(dateStr: string | undefined, userId?: string): Promise<QueueTicketDto> {
    const { date } = resolveDate(dateStr);
    const calledAt = toVietnamDbDateTime();
    const ticket = await queueRepository.callNextWaiting(date, calledAt);

    if (!ticket) {
      throw new AppError(404, 'NO_WAITING_TICKET', 'Không còn số đang chờ');
    }

    await auditPort.record({
      action: 'queue.call_next',
      resource: 'QueueTicket',
      resourceId: ticket.id,
      userId,
      metadata: { number: ticket.number },
    });

    await publishTicketEvent('queue.ticket.called', ticket);
    return toTicketDto(ticket);
  }

  /**
   * called → skipped.
   */
  async skipTicket(
    ticketId: string,
    reason: string | undefined,
    userId?: string,
  ): Promise<QueueTicketDto> {
    const ticket = await queueRepository.findById(ticketId);
    if (!ticket) {
      throw new AppError(404, 'QUEUE_TICKET_NOT_FOUND', 'Không tìm thấy số thứ tự');
    }

    if (ticket.status !== 'called') {
      throw new AppError(
        409,
        'INVALID_QUEUE_TRANSITION',
        'Chỉ được bỏ qua số đang ở trạng thái đã gọi',
      );
    }

    const updated = await queueRepository.updateStatus(ticketId, {
      status: 'skipped',
    });

    await auditPort.record({
      action: 'queue.skip',
      resource: 'QueueTicket',
      resourceId: ticketId,
      userId,
      metadata: { hasReason: Boolean(reason) },
    });

    await publishTicketEvent('queue.ticket.updated', updated);
    return toTicketDto(updated);
  }

  /**
   * skipped → called (gọi lại).
   */
  async recallTicket(
    ticketId: string,
    reason: string,
    userId?: string,
  ): Promise<QueueTicketDto> {
    const ticket = await queueRepository.findById(ticketId);
    if (!ticket) {
      throw new AppError(404, 'QUEUE_TICKET_NOT_FOUND', 'Không tìm thấy số thứ tự');
    }

    if (ticket.status !== 'skipped') {
      throw new AppError(
        409,
        'INVALID_QUEUE_TRANSITION',
        'Chỉ được gọi lại số đã bỏ qua',
      );
    }

    const calledAt = toVietnamDbDateTime();
    const updated = await queueRepository.updateStatus(ticketId, {
      status: 'called',
      calledAt,
    });

    await auditPort.record({
      action: 'queue.recall',
      resource: 'QueueTicket',
      resourceId: ticketId,
      userId,
      metadata: { reasonLength: reason.length },
    });

    await publishTicketEvent('queue.ticket.called', updated);
    return toTicketDto(updated);
  }

  /**
   * Bốc số tại quầy (source reception_desk) — vẫn waiting để call-next / list.
   */
  async issueDeskTicket(idempotencyKey: string): Promise<IssuedTicketDto> {
    return this.issueTicket({
      idempotencyKey,
      source: QUEUE_SOURCE.RECEPTION_DESK,
    });
  }
}

export const queueService = new QueueService();
