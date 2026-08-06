/** Trạng thái vòng đời số thứ tự; thứ tự FIFO và chuyển trạng thái do server quyết định. */
export type QueueStatus = 'waiting' | 'called' | 'served' | 'skipped';

/** DTO số thứ tự trong hàng đợi, với ngày và thời điểm theo ISO từ backend. */
export type QueueTicketDto = {
  ticketId: string;
  number: number;
  date: string;
  status: QueueStatus;
  calledAt: string | null;
  servedAt: string | null;
};

/** Kết quả cấp số công khai; trạng thái ban đầu luôn là `waiting`. */
export type IssuedTicketDto = {
  ticketId: string;
  number: number;
  date: string;
  status: 'waiting';
  receipt: {
    systemName: string;
    ticketType: string;
    issuedAt: string;
    instruction: string;
  };
};

/** Snapshot tối giản cho bảng gọi số công khai, không chứa định danh người bệnh. */
export type PublicQueueDisplayDto = {
  date: string;
  currentlyCalled: Array<{
    ticketId: string;
    number: number;
    calledAt: string | null;
  }>;
  recentlyServedNumbers: number[];
};

/** Payload realtime dùng để cập nhật một số thứ tự theo ngày hoạt động. */
export type QueueRealtimePayload = {
  ticketId: string;
  number: number;
  status: QueueStatus;
  calledAt?: string | null;
  date: string;
};

/** Dòng lịch sử trình bày trên bảng gọi số; `time` là giờ hiển thị theo locale của UI. */
export type QueueHistoryItem = {
  counter: string;
  isCurrent?: boolean;
  number: string;
  time?: string;
};

/** KPI hàng đợi với tone hiển thị giới hạn trong palette của bảng dashboard. */
export type QueueStat = {
  label: string;
  tone?: 'blue' | 'green' | 'amber';
  value: string;
};

