import type { Server, Socket } from 'socket.io';
import { randomUUID } from 'node:crypto';

import { AppError } from '../core/errors/appError';
import { logger } from '../core/logger/logger';
import { getVietnamLegalDateString } from '../core/time/vietnamClock';
import {
  SOCKET_QUEUE_ISSUE,
  SOCKET_QUEUE_ISSUE_ERROR,
  SOCKET_QUEUE_ISSUE_RESULT,
  SOCKET_QUEUE_JOIN,
} from '../modules/queue/constants/queue.constants';
import { socketIssuePayloadSchema } from '../modules/queue/schemas/queue.schemas';
import { queueService } from '../modules/queue/services/queue.service';

/**
 * Đăng ký socket handlers cho hàng đợi.
 * Lấy số kiosk: event `queue.ticket.issue` (WebSocket).
 */
export function registerQueueSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected');

    const legalDate = getVietnamLegalDateString();
    socket.join(`queue:${legalDate}`);

    socket.on(SOCKET_QUEUE_JOIN, (payload: { date?: string } | undefined) => {
      const date =
        payload?.date && /^\d{4}-\d{2}-\d{2}$/.test(payload.date)
          ? payload.date
          : getVietnamLegalDateString();
      socket.join(`queue:${date}`);
      socket.emit('queue.joined', { room: `queue:${date}`, date });
    });

    /**
     * Kiosk lấy số qua WebSocket.
     * Client: emit queue.ticket.issue { idempotencyKey }
     * Server: emit queue.ticket.issue.result | queue.ticket.issue.error
     */
    socket.on(SOCKET_QUEUE_ISSUE, async (payload: unknown) => {
      try {
        const parsed = socketIssuePayloadSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit(SOCKET_QUEUE_ISSUE_ERROR, {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'idempotencyKey (UUID) là bắt buộc',
              requestId: randomUUID(),
            },
          });
          return;
        }

        const data = await queueService.issueTicket({
          idempotencyKey: parsed.data.idempotencyKey,
        });

        socket.emit(SOCKET_QUEUE_ISSUE_RESULT, {
          data,
          meta: {
            requestId: randomUUID(),
            channel: 'websocket',
          },
        });
      } catch (error) {
        const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
        const message =
          error instanceof AppError
            ? error.message
            : 'Không lấy được số. Vui lòng thử lại.';

        logger.error({ error, socketId: socket.id }, 'queue.ticket.issue failed');
        socket.emit(SOCKET_QUEUE_ISSUE_ERROR, {
          error: {
            code,
            message,
            requestId: randomUUID(),
          },
        });
      }
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });
}
