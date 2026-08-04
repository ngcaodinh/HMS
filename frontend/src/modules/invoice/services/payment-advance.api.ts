import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

export type PaymentAdvanceDto = {
  id: string;
  type: 'deposit' | 'refund';
  amount: string;
  method: 'cash' | 'momo';
  reason: string | null;
  receiptNumber: string | null;
  createdAt: string;
};

export type PaymentAdvanceSummaryDto = {
  items: PaymentAdvanceDto[];
  totalDeposited: string;
  totalRefunded: string;
  balance: string;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export async function getPaymentAdvances(recordId: string): Promise<PaymentAdvanceSummaryDto> {
  const response = await apiClient.get<ApiSuccess<PaymentAdvanceSummaryDto>>(
    `/medical-records/${recordId}/payment-advances`,
  );
  return response.data.data;
}

export async function createPaymentAdvance(
  recordId: string,
  body: { amountVnd: number; method: 'cash' | 'momo'; reason?: string },
): Promise<PaymentAdvanceDto> {
  const response = await apiClient.post<ApiSuccess<PaymentAdvanceDto>>(
    `/medical-records/${recordId}/payment-advances`,
    body,
  );
  return response.data.data;
}

export async function createPaymentAdvanceRefund(
  recordId: string,
  body: { amountVnd: number; reason: string },
): Promise<PaymentAdvanceDto> {
  const response = await apiClient.post<ApiSuccess<PaymentAdvanceDto>>(
    `/medical-records/${recordId}/payment-advances/refund`,
    body,
  );
  return response.data.data;
}
