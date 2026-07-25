import { io, type Socket } from 'socket.io-client';

import { env } from '@/shared/constants/env';

import {
  SOCKET_QUEUE_ISSUE,
  SOCKET_QUEUE_ISSUE_ERROR,
  SOCKET_QUEUE_ISSUE_RESULT,
  SOCKET_QUEUE_JOIN,
  SOCKET_QUEUE_TICKET_CALLED,
  SOCKET_QUEUE_TICKET_UPDATED,
} from '../constants/queue.constants';
import type { IssuedTicketDto, QueueRealtimePayload } from '../types/queue.types';

let sharedSocket: Socket | null = null;

/**
 * Singleton socket client tới backend.
 */
export function getQueueSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(env.socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return sharedSocket;
}

/**
 * Lấy số kiosk qua WebSocket (kênh chính theo yêu cầu).
 */
export function issueTicketViaSocket(idempotencyKey: string): Promise<IssuedTicketDto> {
  const socket = getQueueSocket();

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      fn();
    };

    const onResult = (payload: { data: IssuedTicketDto }) => {
      finish(() => resolve(payload.data));
    };

    const onError = (payload: { error?: { message?: string; code?: string } }) => {
      finish(() => reject(new Error(payload.error?.message ?? 'Không lấy được số thứ tự')));
    };

    const onConnect = () => {
      socket.emit(SOCKET_QUEUE_ISSUE, { idempotencyKey });
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('Hết thời gian chờ lấy số. Vui lòng thử lại.')));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off(SOCKET_QUEUE_ISSUE_RESULT, onResult);
      socket.off(SOCKET_QUEUE_ISSUE_ERROR, onError);
      socket.off('connect', onConnect);
    };

    socket.on(SOCKET_QUEUE_ISSUE_RESULT, onResult);
    socket.on(SOCKET_QUEUE_ISSUE_ERROR, onError);

    if (socket.connected) {
      socket.emit(SOCKET_QUEUE_ISSUE, { idempotencyKey });
      return;
    }

    socket.on('connect', onConnect);
    socket.connect();
  });
}

/**
 * Join room LED theo ngày VN.
 */
export function joinQueueRoom(date?: string): void {
  const socket = getQueueSocket();
  socket.emit(SOCKET_QUEUE_JOIN, date ? { date } : {});
}

/**
 * Subscribe realtime ticket events (no PII).
 */
export function subscribeQueueEvents(handlers: {
  onCalled?: (payload: QueueRealtimePayload) => void;
  onUpdated?: (payload: QueueRealtimePayload) => void;
}): () => void {
  const socket = getQueueSocket();

  if (handlers.onCalled) {
    socket.on(SOCKET_QUEUE_TICKET_CALLED, handlers.onCalled);
  }
  if (handlers.onUpdated) {
    socket.on(SOCKET_QUEUE_TICKET_UPDATED, handlers.onUpdated);
  }

  return () => {
    if (handlers.onCalled) {
      socket.off(SOCKET_QUEUE_TICKET_CALLED, handlers.onCalled);
    }
    if (handlers.onUpdated) {
      socket.off(SOCKET_QUEUE_TICKET_UPDATED, handlers.onUpdated);
    }
  };
}

export function isQueueSocketConnected(): boolean {
  return Boolean(sharedSocket?.connected);
}
