export type QueueStatus = 'waiting' | 'called' | 'served' | 'skipped';

export type QueueTicketDto = {
  ticketId: string;
  number: number;
  date: string;
  status: QueueStatus;
  calledAt: string | null;
  servedAt: string | null;
};

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

export type PublicQueueDisplayDto = {
  date: string;
  currentlyCalled: Array<{
    ticketId: string;
    number: number;
    calledAt: string | null;
  }>;
  recentlyServedNumbers: number[];
};

export type QueueRealtimePayload = {
  ticketId: string;
  number: number;
  status: QueueStatus;
  calledAt?: string | null;
  date: string;
};

export type QueueHistoryItem = {
  counter: string;
  isCurrent?: boolean;
  number: string;
  time?: string;
};

export type QueueStat = {
  label: string;
  tone?: 'blue' | 'green' | 'amber';
  value: string;
};

