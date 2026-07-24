import type { Server } from 'socket.io';

import { logger } from '../logger/logger';

export type QueueRealtimeEventName = 'queue.ticket.called' | 'queue.ticket.updated';

export type QueueRealtimePayload = {
  ticketId: string;
  number: number;
  status: 'waiting' | 'called' | 'served' | 'skipped';
  calledAt?: string | null;
  date: string;
};

export type PublishQueueInput = {
  eventName: QueueRealtimeEventName;
  date: string;
  payload: QueueRealtimePayload;
};

export interface RealtimePort {
  publishQueue(input: PublishQueueInput): Promise<{ published: boolean; eventName: string }>;
  setSocketServer(io: Server): void;
}

/**
 * RealtimePort — publish vào room queue:YYYY-MM-DD.
 */
export class SocketRealtimePort implements RealtimePort {
  private io: Server | null = null;

  setSocketServer(io: Server): void {
    this.io = io;
  }

  async publishQueue(
    input: PublishQueueInput,
  ): Promise<{ published: boolean; eventName: string }> {
    const room = `queue:${input.date}`;
    const safePayload = {
      ticketId: input.payload.ticketId,
      number: input.payload.number,
      status: input.payload.status,
      calledAt: input.payload.calledAt ?? null,
      date: input.payload.date,
    };

    if (!this.io) {
      logger.warn({ eventName: input.eventName, room }, 'RealtimePort: io not ready (no-op)');
      return { published: false, eventName: input.eventName };
    }

    this.io.to(room).emit(input.eventName, safePayload);
    this.io.to(room).emit('queue:board-updated', safePayload);
    logger.debug(
      { eventName: input.eventName, room, number: safePayload.number },
      'queue event published',
    );
    return { published: true, eventName: input.eventName };
  }
}

export const realtimePort: RealtimePort = new SocketRealtimePort();
