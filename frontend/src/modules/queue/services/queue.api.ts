import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

import type {
  IssuedTicketDto,
  PublicQueueDisplayDto,
  QueueStatus,
  QueueTicketDto,
} from '../types/queue.types';

/**
 * REST Queue API (/api/v1) — staff + public display + reprint.
 */
export async function fetchPublicQueueDisplay(date?: string): Promise<PublicQueueDisplayDto> {
  const response = await apiClient.get<ApiSuccess<PublicQueueDisplayDto>>(
    '/public/queue-display',
    { params: date ? { date } : undefined },
  );
  return response.data.data;
}

export async function reprintQueueTicket(ticketId: string): Promise<{
  ticketId: string;
  number: number;
  date: string;
  renderData: { systemName: string; ticketType: string };
}> {
  const response = await apiClient.post<
    ApiSuccess<{
      ticketId: string;
      number: number;
      date: string;
      renderData: { systemName: string; ticketType: string };
    }>
  >(`/queue-tickets/${ticketId}/print`);
  return response.data.data;
}

export async function listQueueTickets(params: {
  date: string;
  status?: QueueStatus;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: QueueTicketDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get<ApiSuccess<QueueTicketDto[]>>('/queue-tickets', {
    params: {
      date: params.date,
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 50,
    },
  });

  return {
    items: response.data.data,
    pagination: response.data.pagination ?? {
      page: 1,
      pageSize: 50,
      totalItems: response.data.data.length,
      totalPages: 1,
    },
  };
}

export async function callNextQueueTicket(date?: string): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    '/queue-tickets/call-next',
    date ? { date } : {},
  );
  return response.data.data;
}

export async function skipQueueTicket(
  ticketId: string,
  reason?: string,
): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    `/queue-tickets/${ticketId}/skip`,
    reason ? { reason } : {},
  );
  return response.data.data;
}

export async function recallQueueTicket(
  ticketId: string,
  reason: string,
): Promise<QueueTicketDto> {
  const response = await apiClient.post<ApiSuccess<QueueTicketDto>>(
    `/queue-tickets/${ticketId}/recall`,
    { reason },
  );
  return response.data.data;
}

export async function issueDeskTicket(idempotencyKey: string): Promise<IssuedTicketDto> {
  const response = await apiClient.post<ApiSuccess<IssuedTicketDto>>(
    '/queue-tickets/desk',
    {},
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return response.data.data;
}

/** REST fallback nếu socket lỗi (không dùng làm kênh chính kiosk). */
export async function issueTicketRest(idempotencyKey: string): Promise<IssuedTicketDto> {
  const response = await apiClient.post<ApiSuccess<IssuedTicketDto>>(
    '/queue-tickets',
    {},
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return response.data.data;
}
