export const QUEUE_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  SERVED: 'served',
  SKIPPED: 'skipped',
} as const;

export type QueueStatusValue = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];

export const QUEUE_SOURCE = {
  KIOSK: 'kiosk',
  RECEPTION_DESK: 'reception_desk',
} as const;

export const QUEUE_RECEIPT = {
  systemName: 'HMS-VN',
  ticketType: 'Khám bệnh',
  instruction: 'Vui lòng chờ gọi số.',
} as const;

/** Socket event: kiosk lấy số qua WebSocket */
export const SOCKET_QUEUE_ISSUE = 'queue.ticket.issue';
export const SOCKET_QUEUE_ISSUE_RESULT = 'queue.ticket.issue.result';
export const SOCKET_QUEUE_ISSUE_ERROR = 'queue.ticket.issue.error';
export const SOCKET_QUEUE_JOIN = 'queue.join';
