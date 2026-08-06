import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

/**
 * DTO hóa đơn từ API billing.
 *
 * @remarks
 * - Tiền trên wire là chuỗi Decimal VNĐ theo định dạng 2 chữ số thập phân; backend thực hiện
 *   tính toán/làm tròn trước khi trả về, client chỉ map và hiển thị.
 * - `healthInsuranceBenefitRateSnapshot`, các trường `*Amount` và `amountDue` là kết quả server;
 *   client không được tự nhập số tiền hoặc tỷ lệ giảm BHYT.
 * - Trạng thái API dùng `pending`, `paid`, `cancelled`, `write_off`; đây là nguồn quyết định
 *   workflow, không suy diễn từ số tiền hoặc phương thức thanh toán ở client.
 */
export type InvoiceApiDto = {
  invoiceId: string;
  recordId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'write_off';
  items: Array<{
    invoiceItemId: string;
    description: string;
    category: string;
    quantity: string; // Số lượng theo chuỗi Decimal của API, không phải số tiền người dùng tự nhập.
    unitPrice: string; // Đơn giá VNĐ dạng Decimal string, lấy từ snapshot server.
    amount: string; // Thành tiền VNĐ dạng Decimal string do server tính.
    coveredByHealthInsurance: boolean;
    healthInsuranceBenefitRateSnapshot?: string | null; // Tỉ số dạng `0.8000`, do server snapshot.
    healthInsuranceFundAmount: string; // Quỹ BHYT trả, VNĐ Decimal string do server tính.
    patientCoPayAmount: string; // Người bệnh cùng chi trả, VNĐ Decimal string do server tính.
  }>;
  subtotal: string; // Tổng chi phí VNĐ dạng Decimal string.
  healthInsuranceBaseAmount: string;
  healthInsuranceDiscountAmount: string; // Tổng quỹ BHYT trả, không phải giá trị client nhập.
  totalAmount: string; // Tổng phần người bệnh trước khấu trừ tạm ứng, do server tính.
  advanceAppliedAmount: string; // Tạm ứng được server khấu trừ, không phải giảm BHYT.
  amountDue: string; // Số tiền phải thu sau BHYT và tạm ứng, do server tính.
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
    treatmentType: 'outpatient' | 'inpatient' | null;
    bedId: string | null;
    department: string | null;
  };
  healthInsuranceEligibility?: {
    cardStatus: 'none_or_expired' | 'valid';
    effectiveBenefitLevel: string;
    effectiveBenefitRate: string; // Tỉ số BHYT hiệu lực dạng Decimal string do server xác định.
    healthInsuranceRouteType: string | null;
    healthInsuranceRuleSource?: string | null;
    noticeCode?: string | null;
  };
  statement?: { status: string; copies: number; statementNumber?: string | null };
};

/**
 * Tạo hóa đơn ở trạng thái `pending` từ hồ sơ bệnh án đã có dữ liệu chi phí.
 *
 * @param body - ID hồ sơ, enum mức hưởng BHYT và tuyến khám được phép chọn trên UI.
 * @returns DTO hóa đơn do backend tạo, gồm chi tiết dịch vụ, snapshot BHYT và số tiền phải thu.
 * @remarks Gọi `POST /invoices`, yêu cầu quyền tạo hóa đơn. Client chỉ gửi enum
 * `healthInsuranceBenefitLevel`/`healthInsuranceRouteType`; không được gửi số tiền hoặc tỷ lệ
 * giảm BHYT thủ công. Backend kiểm tra thẻ, tính Decimal, làm tròn và trả lỗi nghiệp vụ/quyền nếu
 * không hợp lệ.
 */
export async function createInvoice(body: {
  recordId: string;
  healthInsuranceBenefitLevel: 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100';
  healthInsuranceRouteType?: 'right_route' | 'referral' | 'emergency' | 'wrong_route';
}): Promise<InvoiceApiDto> {
  const response = await apiClient.post<ApiSuccess<InvoiceApiDto>>('/invoices', body);
  return response.data.data;
}

/**
 * Lấy hóa đơn theo ID để đồng bộ trạng thái và số liệu chuẩn từ backend.
 *
 * @param invoiceId - ID hóa đơn đã được API cấp.
 * @returns DTO hóa đơn hiện tại, bao gồm trạng thái thanh toán và snapshot BHYT.
 * @remarks Gọi `GET /invoices/:invoiceId`, yêu cầu quyền đọc hóa đơn; lỗi không tìm thấy, lỗi
 *   quyền hoặc lỗi HTTP được apiClient chuyển tiếp cho caller.
 */
export async function getInvoice(invoiceId: string): Promise<InvoiceApiDto> {
  const response = await apiClient.get<ApiSuccess<InvoiceApiDto>>(`/invoices/${invoiceId}`);
  return response.data.data;
}

/**
 * Liệt kê hóa đơn theo hồ sơ/trạng thái với phân trang do backend áp dụng.
 *
 * @param params - Bộ lọc tùy chọn; `status` dùng enum API (`pending`, `paid`, `cancelled`,
 *   `write_off`), không dùng nhãn hiển thị của view.
 * @returns Danh sách DTO và tổng số bản ghi; fallback pagination dùng độ dài dữ liệu khi envelope
 *   không có tổng số.
 * @remarks Gọi `GET /invoices` với query, yêu cầu quyền đọc hóa đơn. Client không tự tổng hợp lại
 *   số tiền từ item để thay thế giá trị server trả về.
 */
export async function listInvoices(params?: {
  recordId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: InvoiceApiDto[]; pagination: { totalItems: number } }> {
  const response = await apiClient.get<
    ApiSuccess<InvoiceApiDto[]> & {
      pagination?: { totalItems: number };
    }
  >('/invoices', { params });
  return {
    items: response.data.data,
    pagination: response.data.pagination ?? { totalItems: response.data.data.length },
  };
}

/** Hồ sơ đủ điều kiện làm nguồn lập hóa đơn; phí dịch vụ là chuỗi Decimal do backend trả về. */
export type InvoiceCandidateDto = {
  recordId: string;
  recordCode: string;
  treatmentType: 'outpatient' | 'inpatient' | null;
  bedId: string | null;
  isEmergency: boolean;
  createdAt: string;
  department: string | null;
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string | null;
    identityCardNumber: string | null;
    healthInsuranceCode: string | null;
    healthInsuranceExpiryDate: string | null;
  };
  serviceOrders: Array<{
    id: string;
    code: string;
    name: string;
    fee: string; // Đơn giá VNĐ dạng Decimal string; client chỉ dùng để xem trước.
  }>;
};

/**
 * Lấy danh sách hồ sơ có thể mở trong màn hình lập hóa đơn.
 *
 * @param params - Số trang và kích thước trang theo giới hạn API.
 * @returns Danh sách hồ sơ/dịch vụ và tổng số bản ghi từ response envelope.
 * @remarks Gọi `GET /invoice-candidates` với quyền đọc hóa đơn. Dữ liệu chỉ là nguồn xem trước;
 *   server vẫn tổng hợp chi phí, kiểm tra BHYT và tạo snapshot khi `createInvoice` được gọi.
 */
export async function listInvoiceCandidates(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: InvoiceCandidateDto[]; pagination: { totalItems: number } }> {
  const response = await apiClient.get<
    ApiSuccess<InvoiceCandidateDto[]> & {
      pagination?: { totalItems: number };
    }
  >('/invoice-candidates', { params });
  return {
    items: response.data.data,
    pagination: response.data.pagination ?? { totalItems: response.data.data.length },
  };
}

/**
 * Hủy hóa đơn đang chờ thanh toán mà không xóa bản ghi lịch sử.
 *
 * @param invoiceId - ID hóa đơn cần hủy.
 * @param body - Phiên bản kỳ vọng để chống ghi đè và lý do hủy bắt buộc.
 * @returns DTO hóa đơn sau khi backend chuyển sang `cancelled`.
 * @remarks Gọi `POST /invoices/:invoiceId/cancel`, yêu cầu quyền hủy hóa đơn. Backend kiểm tra
 *   trạng thái/phiên bản và ghi audit; lỗi xung đột, validation hoặc permission được giữ nguyên.
 */
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

/**
 * Ghi nhận miễn giảm thất thu cho hóa đơn đủ điều kiện nghiệp vụ.
 *
 * @param invoiceId - ID hóa đơn cần ghi nhận.
 * @param body - Phiên bản kỳ vọng và lý do write-off; không có trường số tiền để client tự đặt.
 * @returns DTO hóa đơn sau khi backend chuyển sang `write_off`.
 * @remarks Gọi `POST /invoices/:invoiceId/write-off`, yêu cầu quyền `invoice.write_off`. Backend
 *   quyết định điều kiện (gồm trường hợp cấp cứu/phê duyệt), số tiền và trạng thái; client không
 *   được tự nhập số tiền giảm BHYT hay số tiền write-off.
 */
export async function writeOffInvoice(
  invoiceId: string,
  body: { expectedVersion: number; writeOffReason: string },
): Promise<InvoiceApiDto> {
  const response = await apiClient.post<ApiSuccess<InvoiceApiDto>>(
    `/invoices/${invoiceId}/write-off`,
    body,
  );
  return response.data.data;
}
