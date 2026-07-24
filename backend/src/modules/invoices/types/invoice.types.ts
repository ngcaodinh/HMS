/**
 * Invoice / settlement DTOs — money fields are decimal strings.
 */

export type HealthInsuranceBenefitLevelDto =
  | 'NO_COVERAGE'
  | 'RATE_80'
  | 'RATE_95'
  | 'RATE_100';

export type HealthInsuranceRouteTypeDto =
  | 'right_route'
  | 'referral'
  | 'emergency'
  | 'wrong_route';

export type InvoiceStatusDto = 'pending' | 'paid' | 'cancelled' | 'write_off';

export type InvoiceItemDto = {
  invoiceItemId: string;
  description: string;
  category: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  coveredByHealthInsurance: boolean;
  healthInsuranceBenefitLevel?: HealthInsuranceBenefitLevelDto | null;
  healthInsuranceBenefitRateSnapshot?: string | null;
  healthInsuranceEligibleAmount: string;
  healthInsuranceCeilingAmount: string;
  healthInsuranceFundAmount: string;
  patientCoPayAmount: string;
};

export type InvoiceDto = {
  invoiceId: string;
  recordId: string;
  status: InvoiceStatusDto;
  healthInsuranceEligibility?: {
    cardStatus: string;
    effectiveBenefitLevel: HealthInsuranceBenefitLevelDto;
    effectiveBenefitRate: string;
    healthInsuranceRouteType: HealthInsuranceRouteTypeDto | null;
    healthInsuranceRuleSource: string | null;
    noticeCode: string | null;
  };
  items: InvoiceItemDto[];
  subtotal: string;
  healthInsuranceBaseAmount: string;
  healthInsuranceDiscountAmount: string;
  totalAmount: string;
  advanceAppliedAmount: string;
  amountDue: string;
  paymentMethod?: 'cash' | 'momo' | null;
  receiptNumber?: string | null;
  paidAt?: string | null;
  momoOrderId?: string | null;
  statement?: { status: string; copies: number; statementNumber?: string | null };
  healthInsuranceClaim?: {
    claimId: string;
    status: string;
    source?: string;
  } | null;
  settlement: {
    isSettlementFinal: boolean;
    allowedStatuses: string[];
    writeOffEligibility?: string;
  };
  version: number;
  patient?: {
    patientId: string;
    patientCode: string;
    fullName: string;
    recordCode: string;
  };
};
