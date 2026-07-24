import type { QueueTicketStatus } from '@prisma/client';

export type QueueTicketDto = {
  ticketId: string;
  number: number;
  date: string;
  status: QueueTicketStatus;
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

export type ReprintTicketDto = {
  ticketId: string;
  number: number;
  date: string;
  renderData: {
    systemName: string;
    ticketType: string;
  };
};
