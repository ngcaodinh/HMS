/**
 * BillingPaymentIntentPort — đăng ký intent Momo trước khi trả payUrl.
 * Owner ghi: Billing (qua service); Payment chỉ gọi port.
 */

export type RegisterMomoIntentInput = {
  invoiceId: string;
  momoOrderId: string;
  requestId: string;
  amount: string;
  expiresAt: string;
  idempotencyKey: string;
  payUrl?: string;
};

export type RegisterMomoIntentResult = {
  invoiceId: string;
  momoOrderId: string;
  requestId: string;
  amount: string;
  expiresAt: string;
  status: 'pending';
  intentPersistence: 'durable_G9' | 'mock_G9';
  payUrl?: string;
};

export interface BillingPaymentIntentPort {
  /**
   * Đăng ký / replay intent Momo cho invoice pending.
   */
  registerMomo(input: RegisterMomoIntentInput): Promise<RegisterMomoIntentResult>;
}

export class UnimplementedBillingPaymentIntentPort implements BillingPaymentIntentPort {
  async registerMomo(_input: RegisterMomoIntentInput): Promise<RegisterMomoIntentResult> {
    throw new Error('BillingPaymentIntentPort chưa được gắn implementation');
  }
}

export let billingPaymentIntentPort: BillingPaymentIntentPort =
  new UnimplementedBillingPaymentIntentPort();

export function setBillingPaymentIntentPort(port: BillingPaymentIntentPort): void {
  billingPaymentIntentPort = port;
}
