import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

export type CashPaymentResult = {
  invoiceId: string;
  paymentMethod: 'cash';
  status: 'paid';
  receiptNumber: string;
  paidAt: string;
};

export type MomoPaymentRequest = {
  invoiceId: string;
  momoOrderId: string;
  requestId: string;
  amount: string;
  payUrl: string;
  qrPayload: string;
  expiresAt: string;
  status: 'pending';
};

export type PaymentStatus = {
  invoiceId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'write_off';
  paymentMethod: 'cash' | 'momo' | null;
  momoOrderId: string | null;
  paidAt: string | null;
};

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Thanh toán tiền mặt.
 */
export async function settleCashPayment(invoiceId: string): Promise<CashPaymentResult> {
  const response = await apiClient.post<ApiSuccess<CashPaymentResult>>(
    `/invoices/${invoiceId}/cash-payments`,
    {},
    { headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );
  return response.data.data;
}

/**
 * Tạo yêu cầu Momo (mock/sandbox).
 */
export async function createMomoPaymentRequest(
  invoiceId: string,
): Promise<MomoPaymentRequest> {
  const response = await apiClient.post<ApiSuccess<MomoPaymentRequest>>(
    `/invoices/${invoiceId}/momo-payment-requests`,
    {},
    { headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );
  return response.data.data;
}

export async function getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
  const response = await apiClient.get<ApiSuccess<PaymentStatus>>(
    `/invoices/${invoiceId}/payment-status`,
  );
  return response.data.data;
}

/**
 * Sau redirect return từ Momo — query/sync nếu IPN chưa về.
 */
export async function syncMomoPayment(invoiceId: string): Promise<PaymentStatus> {
  const response = await apiClient.post<ApiSuccess<PaymentStatus>>(
    `/invoices/${invoiceId}/momo-sync`,
    {},
  );
  return response.data.data;
}

/**
 * Dev only: giả lập IPN khi USE_MOMO_MOCK (không dùng sandbox).
 */
export async function simulateMomoIpnSuccess(params: {
  momoOrderId: string;
  amount: string;
  requestId?: string;
}): Promise<void> {
  const amountInt = Math.floor(Number(params.amount));
  await apiClient.post('/webhooks/momo', {
    orderId: params.momoOrderId,
    transId: `DEV-TX-${Date.now()}`,
    resultCode: 0,
    amount: amountInt,
    signature: 'mock',
    partnerCode: 'MOMO',
    requestId: params.requestId ?? 'mock-req',
    orderInfo: 'dev',
    extraData: '',
    message: 'Success',
  });
}
