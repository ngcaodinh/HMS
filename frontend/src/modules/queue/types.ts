/**
 * Barrel type công khai cho các DTO, trạng thái và payload realtime của hàng đợi.
 *
 * @remarks Các type được định nghĩa ở module con để dùng chung giữa adapter, socket và page;
 * chúng chỉ mô tả số thứ tự/trạng thái/thời điểm cần cho UI, không mở rộng quyền truy cập dữ liệu.
 */
export type {
  IssuedTicketDto,
  PublicQueueDisplayDto,
  QueueHistoryItem,
  QueueRealtimePayload,
  QueueStat,
  QueueStatus,
  QueueTicketDto,
} from './types/queue.types';
