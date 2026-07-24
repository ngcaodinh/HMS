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
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Hết thời gian chờ lấy số. Vui lòng thử lại.'));
    }, 15000);

    const onResult = (payload: { data: IssuedTicketDto }) => {
      cleanup();
      resolve(payload.data);
    };

    const onError = (payload: { error?: { message?: string; code?: string } }) => {
      cleanup();
      reject(new Error(payload.error?.message ?? 'Không lấy được số thứ tự'));
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off(SOCKET_QUEUE_ISSUE_RESULT, onResult);
      socket.off(SOCKET_QUEUE_ISSUE_ERROR, onError);
    };

    const emitIssue = () => {
      socket.emit(SOCKET_QUEUE_ISSUE, { idempotencyKey });
    };

    socket.on(SOCKET_QUEUE_ISSUE_RESULT, onResult);
    socket.on(SOCKET_QUEUE_ISSUE_ERROR, onError);

    if (socket.connected) {
      emitIssue();
      return;
    }

    const onConnect = () => {
      socket.off('connect', onConnect);
      emitIssue();
    };
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
export function subscribeQueueEvents(
  handlers: {
    onCalled?: (payload: QueueRealtimePayload) => void;
    onUpdated?: (payload: QueueRealtimePayload) => void;
  },
): () => void {
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
