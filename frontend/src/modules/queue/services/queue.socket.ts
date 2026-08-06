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
 * Lấy socket dùng chung cho kiosk và màn hình LED.
 *
 * @returns Socket.IO client kết nối tới `env.socketUrl`.
 * @remarks Socket phục vụ các event public của hàng đợi, không tự truyền JWT; access control của
 * các thao tác nhân viên vẫn thuộc HTTP API/backend. Client đăng ký listener phải tự cleanup.
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
 * Cấp số kiosk qua event WebSocket public với idempotency key.
 *
 * @param idempotencyKey Khóa duy nhất cho một lần cấp số, gửi trong payload event.
 * @returns Promise chứa phiếu ở trạng thái `waiting` khi server trả kết quả.
 * @remarks Reject khi server báo lỗi hoặc sau 15 giây timeout. Listener và timer được dọn sau
 * mọi nhánh kết thúc; bên gọi cần hiển thị lỗi và quyết định có thử lại hay không.
 */
export function issueTicketViaSocket(idempotencyKey: string): Promise<IssuedTicketDto> {
  const socket = getQueueSocket();

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      // Result, error và timeout có thể đến gần như đồng thời; chỉ nhánh đầu tiên được phép settle.
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

    // Hủy timer/listener sau khi settle để request cũ không tác động vào lần cấp số kế tiếp.
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
 * Cho socket tham gia room LED theo ngày pháp lý Việt Nam.
 *
 * @param date Ngày dạng `YYYY-MM-DD`; bỏ qua để backend dùng ngày hiện tại.
 * @remarks Event public chỉ dùng để nhận cập nhật số, không đưa PII vào room payload.
 */
export function joinQueueRoom(date?: string): void {
  const socket = getQueueSocket();
  socket.emit(SOCKET_QUEUE_JOIN, date ? { date } : {});
}

/**
 * Đăng ký các event realtime của hàng đợi mà không chứa PII.
 *
 * @param handlers Callback tùy chọn cho event gọi số hoặc cập nhật phiếu.
 * @returns Hàm unsubscribe phải được gọi khi component unmount hoặc đổi subscription.
 * @remarks Không có retry/cache trong adapter; socket tự quản lý kết nối, còn bên gọi chịu trách
 * nhiệm gọi unsubscribe để tránh listener cũ và cập nhật state sau khi rời màn hình.
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

/**
 * Kiểm tra trạng thái kết nối hiện tại của socket dùng chung.
 *
 * @returns `true` khi socket đã connected; không phát sinh kết nối mới hoặc side effect.
 */
export function isQueueSocketConnected(): boolean {
  return Boolean(sharedSocket?.connected);
}
