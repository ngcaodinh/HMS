export type AccountingScreenId = 's1' | 's2' | 's3' | 's4' | 's5';

export type PatientStatus = 'pending_payment' | 'advance_paid' | 'refunded' | 'settled';

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  category: 'khambenh' | 'xetnghiem' | 'sieuan' | 'thuoc' | 'phauthuat';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  bhytCoverRate: number; // e.g. 0.8 (80%)
  bhytPays: number;
  patientPays: number;
}

export interface PatientRecord {
  id: string;
  code: string; // e.g. BN-2026-0089
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  bhytCardNumber: string;
  bhytBenefitRate: number; // e.g. 0.8
  bhytCategory: string; // e.g. Tuyến tỉnh - Đã thông tuyến
  department: string;
  admissionDate: string;
  status: PatientStatus;
  depositAmount: number;
  totalServicesAmount: number;
  bhytTotalPays: number;
  patientCoPayAmount: number;
  remainingAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0312
  patientId: string;
  patientName: string;
  createdAt: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'cancelled';
  items: ServiceItem[];
  subtotal: number;
  bhytDiscount: number;
  advanceDeduction: number;
  finalAmount: number;
  paymentMethod?: 'cash' | 'vietqr' | 'momo';
}

export interface AdvanceReceipt {
  id: string;
  receiptNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  reason: string;
  paymentMethod: 'cash' | 'transfer';
  createdAt: string;
  cashierName: string;
}

export interface ShiftSummary {
  cashierName: string;
  cashierRole: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  cashTotal: number;
  transferTotal: number;
  advanceCollectedTotal: number;
  advanceRefundedTotal: number;
  netRevenue: number;
  totalTransactionsCount: number;
}

export interface TransactionLog {
  id: string;
  time: string;
  type: 'invoice_payment' | 'advance_deposit' | 'advance_refund';
  patientName: string;
  patientCode: string;
  method: 'cash' | 'vietqr' | 'momo';
  amount: number;
  cashier: string;
  status: 'success' | 'pending' | 'failed';
}
