import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

/** Kết quả backend xác nhận thu tiền mặt và chuyển hóa đơn sang `paid`. */
export type CashPaymentResult = {
  invoiceId: string;
  paymentMethod: 'cash';
  status: 'paid';
  receiptNumber: string;
  paidAt: string;
};

/**
 * Yêu cầu thanh toán MoMo do backend tạo.
 *
 * @remarks `amount` là số tiền hóa đơn do server lấy từ `amountDue`, ở dạng chuỗi Decimal VNĐ;
 * client chỉ hiển thị QR/link và trạng thái `pending`, không tự nhập hoặc sửa số tiền. Hóa đơn
 * chỉ chuyển `paid` sau IPN/query được backend xác thực.
 */
export type MomoPaymentRequest = {
  invoiceId: string;
  momoOrderId: string;
  requestId: string;
  amount: string; // VNĐ Decimal string do server tính, không phải số tiền client gửi lên.
  payUrl: string;
  qrPayload: string;
  expiresAt: string; // Thời điểm hết hạn theo định dạng/múi giờ do backend trả về.
  status: 'pending';
};

/** Trạng thái thanh toán chuẩn từ backend, dùng để đồng bộ invoice thay vì suy diễn ở client. */
export type PaymentStatus = {
  invoiceId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'write_off';
  paymentMethod: 'cash' | 'momo' | null;
  momoOrderId: string | null;
  paidAt: string | null;
};

/** Sinh khóa idempotency cho request thu tiền; khóa này không phải token xác thực hay bí mật. */
function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Yêu cầu backend xác nhận thu tiền mặt cho hóa đơn.
 *
 * @param invoiceId - ID hóa đơn đang ở trạng thái chờ thanh toán.
 * @returns Biên lai, thời điểm và trạng thái `paid` do backend xác nhận.
 * @remarks Gọi `POST /invoices/:invoiceId/cash-payments` với body rỗng và `Idempotency-Key`;
 *   backend tự lấy số tiền phải thu, kiểm tra quyền/trạng thái và ghi audit. Client không gửi số
 *   tiền hoặc tự chuyển trạng thái; lỗi HTTP, validation, conflict hoặc permission được chuyển lên.
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
 * Tạo yêu cầu thanh toán MoMo Sandbox qua backend.
 *
 * @param invoiceId - ID hóa đơn đang ở trạng thái chờ thanh toán.
 * @returns URL/QR, mã đơn hàng, số tiền server tính và thời điểm hết hạn; ban đầu ở `pending`.
 * @remarks Gọi `POST /invoices/:invoiceId/momo-payment-requests` với body rỗng và
 * `Idempotency-Key`. Backend lấy `amountDue`, chuyển tiền sang VNĐ integer theo contract gateway,
 * kiểm tra quyền/trạng thái và tạo intent; client không được tự nhập số tiền hay tỷ lệ giảm BHYT.
 */
export async function createMomoPaymentRequest(invoiceId: string): Promise<MomoPaymentRequest> {
  const response = await apiClient.post<ApiSuccess<MomoPaymentRequest>>(
    `/invoices/${invoiceId}/momo-payment-requests`,
    {},
    { headers: { 'Idempotency-Key': createIdempotencyKey() } },
  );
  return response.data.data;
}

/**
 * Đọc trạng thái thanh toán chuẩn của một hóa đơn.
 *
 * @param invoiceId - ID hóa đơn cần đồng bộ.
 * @returns Trạng thái `pending`, `paid`, `cancelled` hoặc `write_off` cùng phương thức/thời điểm.
 * @remarks Gọi `GET /invoices/:invoiceId/payment-status`; backend là nguồn quyết định và lỗi
 *   quyền/HTTP được chuyển tiếp qua apiClient.
 */
export async function getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
  const response = await apiClient.get<ApiSuccess<PaymentStatus>>(
    `/invoices/${invoiceId}/payment-status`,
  );
  return response.data.data;
}

/**
 * Đồng bộ thanh toán sau redirect MoMo khi IPN chưa kịp cập nhật.
 *
 * @param invoiceId - ID hóa đơn được giữ lại để resume luồng thanh toán.
 * @returns Trạng thái thanh toán sau khi backend query/sync; vẫn `pending` nếu chưa xác thực thành
 *   công.
 * @remarks Gọi `POST /invoices/:invoiceId/momo-sync` với body rỗng. Backend mới được phép query
 *   Sandbox/mock và chuyển `paid`; client không tự xác nhận callback, số tiền hoặc trạng thái.
 */
export async function syncMomoPayment(invoiceId: string): Promise<PaymentStatus> {
  const response = await apiClient.post<ApiSuccess<PaymentStatus>>(
    `/invoices/${invoiceId}/momo-sync`,
    {},
  );
  return response.data.data;
}
