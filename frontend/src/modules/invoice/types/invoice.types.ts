/** Mã các màn hình nghiệp vụ trong workspace kế toán; giá trị được dùng để điều hướng nội bộ. */
export type AccountingScreenId = 's1' | 's2' | 's3' | 's4' | 's5';

/**
 * Trạng thái hiển thị của hồ sơ trong luồng lập hóa đơn và thu phí.
 * `advance_paid` là đã có tạm ứng; `settled` là đã quyết toán; `write_off` là miễn giảm
 * thất thu theo nghiệp vụ được backend phê duyệt.
 */
export type PatientStatus =
  | 'pending_payment'
  | 'advance_paid'
  | 'refunded'
  | 'settled'
  | 'cancelled'
  | 'write_off';

/**
 * Một dòng dịch vụ/chi phí dùng trong màn hình hóa đơn và bảng kê.
 *
 * @remarks
 * - Các trường tiền có đơn vị VNĐ; view map từ Decimal của server sang `number` và không tự làm
 *   tròn giá trị.
 * - `bhytCoverRate` là tỷ lệ dạng tỉ số từ 0 đến 1 (ví dụ `0.8`), không phải ô cho client
 *   tự nhập tỷ lệ hoặc số tiền giảm BHYT; hóa đơn chính thức nhận giá trị do server snapshot.
 * - Dữ liệu xem trước có thể chưa có kết quả BHYT; client không dùng type này để tự quyết định
 *   tổng tiền phải thu.
 */
export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  category: 'khambenh' | 'xetnghiem' | 'sieuan' | 'thuoc' | 'phauthuat' | 'khac';
  quantity: number;
  unitPrice: number; // Đơn giá VNĐ; giá trị chính thức do server cung cấp, không làm tròn ở client.
  totalPrice: number; // Thành tiền VNĐ; server tính theo Decimal trước khi map sang view.
  bhytCoverRate: number; // Tỷ lệ BHYT dạng tỉ số 0..1 do server xác định và lưu snapshot.
  bhytPays: number; // Quỹ BHYT thanh toán bằng VNĐ; client chỉ hiển thị, không tự nhập.
  patientPays: number; // Phần người bệnh trả bằng VNĐ sau tính toán server-side.
}

/**
 * Dữ liệu hồ sơ phục vụ tra cứu, lập hóa đơn, tạm ứng và in bảng kê.
 *
 * @remarks
 * - Các số tiền là VNĐ được map từ response server; nguồn chuẩn và quy tắc làm tròn vẫn thuộc
 *   backend.
 * - `bhytBenefitRate` chỉ phục vụ hiển thị/quyền lợi hiện tại; khi lập hóa đơn, server xác định
 *   tỷ lệ hiệu lực và snapshot, client không được tự nhập tỷ lệ hoặc số tiền giảm BHYT.
 * - `serviceItems` có thể là dữ liệu xem trước trước khi server tạo hóa đơn.
 */
export interface PatientRecord {
  id: string;
  recordId?: string;
  code: string;
  fullName: string;
  dob: string; // Chuỗi ngày hiển thị; không dùng làm căn cứ tính tiền.
  gender: 'Nam' | 'Nữ' | 'Chưa cập nhật';
  bhytCardNumber: string;
  bhytBenefitRate: number; // Tỷ lệ dạng tỉ số 0..1; giá trị áp dụng cuối cùng do server quyết định.
  bhytCategory: string;
  department: string;
  admissionDate: string; // Chuỗi ngày/giờ từ dữ liệu hồ sơ; bộ in có fallback khi không parse được.
  status: PatientStatus;
  depositAmount: number; // Tạm ứng/khấu trừ bằng VNĐ do server trả về.
  totalServicesAmount: number; // Tổng chi phí dịch vụ bằng VNĐ; không phải giá trị client tự nhập.
  bhytTotalPays: number; // Tổng quỹ BHYT thanh toán bằng VNĐ do server tính.
  patientCoPayAmount: number; // Phần người bệnh cùng chi trả bằng VNĐ do server tính.
  remainingAmount: number; // Số còn phải thu bằng VNĐ; trạng thái đã tất toán thường là 0.
  phoneNumber?: string | null;
  identityCardNumber?: string | null;
  healthInsuranceExpiryDate?: string | null;
  treatmentType?: 'outpatient' | 'inpatient' | null;
  bedId?: string | null;
  isEmergency?: boolean;
  serviceItems?: ServiceItem[];
}

/**
 * Mô hình hóa đơn đã chuẩn hóa cho màn hình thanh toán và bảng kê in.
 *
 * @remarks
 * - Các trạng thái gồm nháp, chờ thanh toán, đã thanh toán, đã hủy và `write_off` (miễn giảm
 *   thất thu); chỉ trạng thái do backend trả về mới là nguồn quyết định workflow.
 * - Các trường tiền là VNĐ được map sang `number` ở lớp view; tính toán và làm tròn chính thức
 *   thực hiện bằng Decimal ở server. Client chỉ hiển thị, không tự nhập tổng tiền hay giảm BHYT.
 * - `advanceDeduction` là tạm ứng đã khấu trừ; không được hiểu là một khoản giảm BHYT.
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'cancelled' | 'write_off';
  items: ServiceItem[];
  subtotal: number; // Tổng tiền dịch vụ bằng VNĐ do server cung cấp.
  bhytDiscount: number; // Tổng quỹ BHYT thanh toán bằng VNĐ; không phải input giảm tùy ý.
  advanceDeduction: number; // Tạm ứng được server khấu trừ bằng VNĐ.
  finalAmount: number; // Số tiền phải thu sau BHYT và tạm ứng, bằng VNĐ.
  paymentMethod?: 'cash' | 'vietqr' | 'momo'; // Phương thức đã ghi nhận, không phải số tiền thanh toán.
  receiptNumber?: string | null;
  paidAt?: string | null;
}

/** Tổng hợp báo cáo thu phí; các trường tiền là VNĐ do API trả chuỗi Decimal rồi map sang number. */
export interface ShiftSummary {
  cashierName: string;
  cashierRole: string;
  shiftCode: string;
  startTime: string; // Ngày/giờ do backend cung cấp theo múi giờ nghiệp vụ Việt Nam.
  endTime: string; // Ngày/giờ do backend cung cấp theo múi giờ nghiệp vụ Việt Nam.
  cashTotal: number; // Tổng thu tiền mặt bằng VNĐ.
  transferTotal: number; // Tổng thu chuyển khoản/MoMo theo báo cáo bằng VNĐ.
  advanceCollectedTotal: number; // Tổng tạm ứng đã thu bằng VNĐ.
  advanceRefundedTotal: number; // Tổng tạm ứng đã hoàn bằng VNĐ.
  netRevenue: number; // Doanh thu thuần theo báo cáo server, bằng VNĐ.
  totalTransactionsCount: number;
  healthInsuranceTotal?: number; // Tổng quỹ BHYT thanh toán trong kỳ, bằng VNĐ.
  writeOffTotal?: number; // Tổng miễn giảm thất thu trong kỳ, bằng VNĐ.
}

/** Một giao dịch trong báo cáo thu phí, tạm ứng, hoàn tạm ứng hoặc miễn giảm thất thu. */
export interface TransactionLog {
  id: string;
  time: string; // Ngày/giờ giao dịch từ backend; không tự suy diễn tại client.
  type: 'invoice_payment' | 'advance_deposit' | 'advance_refund' | 'write_off';
  patientName: string;
  patientCode: string;
  method: 'cash' | 'vietqr' | 'momo' | 'write_off';
  amount: number; // Số tiền giao dịch bằng VNĐ do server tổng hợp.
  cashier: string;
  status: 'success' | 'pending' | 'failed';
}
