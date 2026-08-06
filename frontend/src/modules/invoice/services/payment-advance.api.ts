import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

/**
 * Một giao dịch tạm ứng nội trú do backend ghi nhận.
 *
 * @remarks `amount` là chuỗi Decimal VNĐ 2 chữ số trên wire; `deposit` là thu vào và `refund` là
 * hoàn ra. Client chỉ hiển thị dữ liệu đã lưu; số dư và điều kiện hoàn tiền do server tính.
 */
export type PaymentAdvanceDto = {
  id: string;
  type: 'deposit' | 'refund';
  amount: string; // VNĐ Decimal string; không phải số tiền giảm BHYT.
  method: 'cash' | 'momo';
  reason: string | null;
  receiptNumber: string | null;
  createdAt: string;
};

/** Tổng tiền tạm ứng, hoàn tạm ứng và số dư nội trú theo trang báo cáo của backend. */
export type PaymentAdvanceSummaryDto = {
  items: PaymentAdvanceDto[];
  totalDeposited: string; // Tổng deposit bằng VNĐ Decimal string.
  totalRefunded: string; // Tổng refund bằng VNĐ Decimal string.
  balance: string; // Số dư = deposit - refund, do server tính bằng Decimal.
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

/**
 * Lấy sổ tạm ứng của một hồ sơ nội trú.
 *
 * @param recordId - ID hồ sơ bệnh án cần truy vấn.
 * @returns Danh sách giao dịch, tổng thu/hoàn và số dư từ response envelope.
 * @remarks Gọi `GET /medical-records/:recordId/payment-advances`, yêu cầu quyền tài chính và
 *   backend chỉ cho hồ sơ nội trú. Client không tự tính lại số dư; lỗi quyền/HTTP được chuyển lên.
 */
export async function getPaymentAdvances(recordId: string): Promise<PaymentAdvanceSummaryDto> {
  const response = await apiClient.get<ApiSuccess<PaymentAdvanceSummaryDto>>(
    `/medical-records/${recordId}/payment-advances`,
  );
  return response.data.data;
}

/**
 * Tạo giao dịch thu tạm ứng nội trú.
 *
 * @param recordId - ID hồ sơ nội trú.
 * @param body - Số tiền tạm ứng VNĐ số nguyên dương, phương thức `cash`/`momo` và lý do tùy chọn.
 * @returns Giao dịch deposit do backend ghi nhận.
 * @remarks Gọi `POST /medical-records/:recordId/payment-advances`. Khoản `amountVnd` này là input
 *   nghiệp vụ tạm ứng được phép nhập; nó không cho phép client gửi số tiền hoặc tỷ lệ giảm BHYT.
 *   Backend vẫn kiểm tra quyền, hồ sơ nội trú, số tiền và ghi audit.
 */
export async function createPaymentAdvance(
  recordId: string,
  body: { amountVnd: number; method: 'cash' | 'momo'; reason?: string },
): Promise<PaymentAdvanceDto> {
  const response = await apiClient.post<ApiSuccess<PaymentAdvanceDto>>(
    `/medical-records/${recordId}/payment-advances`,
    body,
  );
  return response.data.data;
}

/**
 * Tạo giao dịch hoàn phần dư tạm ứng nội trú.
 *
 * @param recordId - ID hồ sơ nội trú cần hoàn.
 * @param body - Số tiền hoàn VNĐ số nguyên dương và lý do bắt buộc.
 * @returns Giao dịch refund sau khi backend kiểm tra không vượt số dư.
 * @remarks Gọi `POST /medical-records/:recordId/payment-advances/refund`. Adapter không gửi
 *   phương thức hoàn; backend hiện ghi nhận endpoint này bằng `cash`, đồng thời kiểm tra quyền,
 *   số dư và audit. Đây là hoàn tạm ứng, không phải điều chỉnh số tiền hoặc tỷ lệ giảm BHYT.
 */
export async function createPaymentAdvanceRefund(
  recordId: string,
  body: { amountVnd: number; reason: string },
): Promise<PaymentAdvanceDto> {
  const response = await apiClient.post<ApiSuccess<PaymentAdvanceDto>>(
    `/medical-records/${recordId}/payment-advances/refund`,
    body,
  );
  return response.data.data;
}
