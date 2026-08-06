/**
 * BillingSettlementPort — Payment lane gọi để chốt thanh toán.
 * Payment không được Prisma-write Invoice trực tiếp (Lane boundary).
 */

export type SettlementPaymentMethod = 'cash' | 'momo';

export type ConfirmSettlementInput = {
  invoiceId: string;
  method: SettlementPaymentMethod;
  idempotencyKey?: string;
  /** Momo transId — dùng dedupe IPN. */
  transId?: string;
  momoOrderId?: string;
  paidAt?: string;
  actorUserId?: string;
};

export type ConfirmSettlementResult = {
  invoiceId: string;
  paymentMethod: SettlementPaymentMethod;
  status: 'paid';
  receiptNumber: string;
  paidAt: string;
  amountDue: string;
  version: number;
  recordClosure?: {
    performed: boolean;
    recordId: string;
    status: string;
  };
};

export interface BillingSettlementPort {
  /**
   * Chốt invoice pending → paid (idempotent theo idempotencyKey hoặc transId).
   */
  confirm(input: ConfirmSettlementInput): Promise<ConfirmSettlementResult>;
}

/**
 * Placeholder — PR-C gắn InvoiceService.confirmSettlement.
 */
export class UnimplementedBillingSettlementPort implements BillingSettlementPort {
  confirm(input: ConfirmSettlementInput): Promise<ConfirmSettlementResult> {
    void input;
    return Promise.reject(new Error('BillingSettlementPort chưa được gắn implementation'));
  }
}

export let billingSettlementPort: BillingSettlementPort = new UnimplementedBillingSettlementPort();

/**
 * Wire implementation từ invoices module sau khi service sẵn sàng.
 */
export function setBillingSettlementPort(port: BillingSettlementPort): void {
  billingSettlementPort = port;
}
