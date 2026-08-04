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
};
