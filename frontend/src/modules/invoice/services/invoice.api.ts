import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

export type InvoiceApiDto = {
  invoiceId: string;
  recordId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'write_off';
  items: Array<{
    invoiceItemId: string;
    description: string;
    category: string;
    quantity: string;
    unitPrice: string;
    amount: string;
    coveredByHealthInsurance: boolean;
    healthInsuranceFundAmount: string;
    patientCoPayAmount: string;
  }>;
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
  version: number;
  patient?: {
    patientId: string;
    patientCode: string;
    fullName: string;
    recordCode: string;
  };
  healthInsuranceEligibility?: {
    effectiveBenefitLevel: string;
    effectiveBenefitRate: string;
    healthInsuranceRouteType: string | null;
  };
  statement?: { status: string; copies: number; statementNumber?: string | null };
};

/**
 * Tạo hóa đơn pending.
 */
export async function createInvoice(body: {
  recordId: string;
  healthInsuranceBenefitLevel: 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100';
  healthInsuranceRouteType?: 'right_route' | 'referral' | 'emergency' | 'wrong_route';
}): Promise<InvoiceApiDto> {
  const response = await apiClient.post<ApiSuccess<InvoiceApiDto>>('/invoices', body);
  return response.data.data;
}

export async function getInvoice(invoiceId: string): Promise<InvoiceApiDto> {
  const response = await apiClient.get<ApiSuccess<InvoiceApiDto>>(`/invoices/${invoiceId}`);
  return response.data.data;
}

export async function listInvoices(params?: {
  recordId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: InvoiceApiDto[]; pagination: { totalItems: number } }> {
  const response = await apiClient.get<ApiSuccess<InvoiceApiDto[]> & {
    pagination?: { totalItems: number };
  }>('/invoices', { params });
  return {
    items: response.data.data,
    pagination: response.data.pagination ?? { totalItems: response.data.data.length },
  };
}

export async function cancelInvoice(
  invoiceId: string,
  body: { expectedVersion: number; cancelReason: string },
): Promise<InvoiceApiDto> {
  const response = await apiClient.post<ApiSuccess<InvoiceApiDto>>(
    `/invoices/${invoiceId}/cancel`,
    body,
  );
  return response.data.data;
}
