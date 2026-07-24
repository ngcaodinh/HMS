/**
 * Payment DTOs — Shared Contract money strings.
 */

export type CashPaymentResultDto = {
  invoiceId: string;
  paymentMethod: 'cash';
  status: 'paid';
  receiptNumber: string;
  paidAt: string;
  recordClosure?: {
    performed: boolean;
    recordId: string;
    status: string;
  };
};

export type MomoPaymentRequestDto = {
  invoiceId: string;
  momoOrderId: string;
  requestId: string;
  amount: string;
  payUrl: string;
  qrPayload: string;
  expiresAt: string;
  intentPersistence: 'durable_G9' | 'mock_G9';
  status: 'pending';
};

export type PaymentStatusDto = {
  invoiceId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'write_off';
  paymentMethod: 'cash' | 'momo' | null;
  momoOrderId: string | null;
  paidAt: string | null;
};
