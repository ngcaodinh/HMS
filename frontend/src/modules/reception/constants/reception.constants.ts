import type { NewPatientForm } from '../types/reception.types';

/**
 * Kiểm tra số điện thoại di động Việt Nam gồm đúng 10 chữ số và đầu số hợp lệ.
 * @remarks Đây chỉ là kiểm tra định dạng ở frontend; backend vẫn là nguồn xác thực cuối cùng.
 */
export const VN_MOBILE_PHONE_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;

/**
 * Kiểm tra CCCD có đúng 12 chữ số ASCII; regex không xác nhận danh tính hay tính hợp lệ nghiệp vụ.
 * @remarks Kiểm tra frontend không thay thế validation và kiểm tra trùng lặp ở backend.
 */
export const IDENTITY_CARD_REGEX = /^\d{12}$/;

/** Số lần gọi tối đa cho 1 ticket trước khi được phép bỏ qua (gồm lần call-next đầu). */
export const MAX_QUEUE_CALL_ATTEMPTS = 3;

/**
 * Nhãn heuristic dùng để chọn đúng một query field cho API tra cứu bệnh nhân.
 * Chuỗi 12 chữ số là CCCD, 10 chữ số là SĐT, số khác chỉ gồm chữ số là không hợp lệ;
 * các giá trị còn lại được xem là họ tên.
 */
export type PatientSearchQueryKind =
  'empty' | 'fullName' | 'identityCardNumber' | 'invalidNumeric' | 'phoneNumber';

/** Bản đồ lỗi hiển thị cạnh trường form; không đại diện cho toàn bộ lỗi validation từ backend. */
export type ReceptionFieldErrors = Partial<{
  dateOfBirth: string;
  doctorId: string;
  form: string;
  fullName: string;
  healthInsuranceCode: string;
  identityCardNumber: string;
  phoneNumber: string;
  phoneNumberUnavailableReason: string;
  privacyNoticeAccepted: string;
}>;

/**
 * Dữ liệu đầu vào cho preflight của form tiếp nhận thường.
 * @remarks `legalDate` dùng `YYYY-MM-DD`; `existingPatientId` bỏ qua kiểm tra hồ sơ hành chính mới,
 * còn `noPhone` điều khiển nhánh yêu cầu lý do không có số điện thoại.
 */
type ReceptionFieldValidationInput = {
  form: NewPatientForm;
  doctorId: string;
  existingPatientId?: string | null;
  hasActiveTicket: boolean;
  legalDate: string;
  noPhone: boolean;
};

/**
 * Kiểm tra ngày ISO có tồn tại thật trên lịch, không chỉ đúng định dạng chuỗi.
 * @param value - Ngày dạng `YYYY-MM-DD` theo lịch dương.
 * @returns `true` khi chuỗi có đúng định dạng và ngày tồn tại trên lịch.
 */
function isRealDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Kiểm tra các điều kiện trước khi tạo hồ sơ mới và trả lỗi theo đúng trường nhập liệu.
 * Bệnh nhân tái khám chỉ cần kiểm tra bác sĩ và số thứ tự; dữ liệu hành chính mới không bị yêu cầu lại.
 * @returns Bản đồ lỗi frontend; object rỗng khi không phát hiện lỗi trước khi gửi request.
 * @remarks Đây là preflight cho UX, không thay thế validation, phân quyền hoặc invariant của backend.
 */
export function getReceptionFieldErrors({
  form,
  doctorId,
  existingPatientId = null,
  hasActiveTicket,
  legalDate,
  noPhone,
}: ReceptionFieldValidationInput): ReceptionFieldErrors {
  const errors: ReceptionFieldErrors = {};

  if (!hasActiveTicket) {
    errors.form = 'Cần gọi số theo thứ tự trước khi tiếp nhận';
  }
  if (!doctorId) {
    errors.doctorId = 'Vui lòng chọn bác sĩ khám';
  }
  if (existingPatientId) {
    return errors;
  }

  const fullName = form.fullName.trim().replace(/\s+/g, ' ');
  if (!fullName) {
    errors.fullName = 'Họ và tên là bắt buộc';
  } else if (fullName.length > 255) {
    errors.fullName = 'Họ và tên tối đa 255 ký tự';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
    errors.dateOfBirth = 'Ngày sinh phải dạng YYYY-MM-DD';
  } else if (!isRealDateString(form.dateOfBirth) || form.dateOfBirth < '1900-01-01') {
    errors.dateOfBirth = 'Ngày sinh không hợp lệ';
  } else if (form.dateOfBirth > legalDate) {
    errors.dateOfBirth = 'Ngày sinh không được ở tương lai';
  }

  if (!form.privacyNoticeAccepted) {
    errors.privacyNoticeAccepted = 'Cần xác nhận thông báo bảo vệ dữ liệu cá nhân';
  }

  const phone = form.phoneNumber.trim();
  if (phone) {
    if (!VN_MOBILE_PHONE_REGEX.test(phone)) {
      errors.phoneNumber = 'Số điện thoại phải 10 số đầu di động Việt Nam';
    }
  } else if (!noPhone) {
    errors.phoneNumber = 'Nhập SĐT hoặc tích không có SĐT và ghi lý do';
  } else if (form.phoneNumberUnavailableReason.trim().length < 3) {
    errors.phoneNumberUnavailableReason = 'Lý do không có SĐT phải có ít nhất 3 ký tự';
  }

  const identityCardNumber = form.identityCardNumber.trim();
  if (identityCardNumber && !IDENTITY_CARD_REGEX.test(identityCardNumber)) {
    errors.identityCardNumber = 'CCCD phải đủ 12 chữ số';
  }

  const healthInsuranceCode = form.healthInsuranceCode.trim();
  if (healthInsuranceCode.length > 20) {
    errors.healthInsuranceCode = 'Mã số thẻ BHYT tối đa 20 ký tự';
  }

  return errors;
}

/**
 * Phân loại truy vấn tìm bệnh nhân theo heuristic mà màn hình reception dùng trước khi gọi API.
 * @param query - Từ khóa có thể là họ tên, SĐT 10 chữ số hoặc CCCD 12 chữ số.
 * @returns Nhãn giúp caller gửi đúng một trong `fullName`, `phoneNumber` hoặc
 * `identityCardNumber`; caller phải tự xử lý `empty` và `invalidNumeric`.
 */
export function classifyPatientSearchQuery(query: string): PatientSearchQueryKind {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return 'empty';
  }
  if (/^\d{12}$/.test(normalizedQuery)) {
    return 'identityCardNumber';
  }
  if (/^\d{10}$/.test(normalizedQuery)) {
    return 'phoneNumber';
  }
  if (/^\d+$/.test(normalizedQuery)) {
    return 'invalidNumeric';
  }

  return 'fullName';
}

/**
 * Xác định cảnh báo BHYT hết hạn bằng cách so sánh hai ngày ISO theo ngày pháp lý.
 * @param expiryDate - Ngày hết hạn thẻ dạng `YYYY-MM-DD`; rỗng nghĩa là chưa có ngày.
 * @param legalDate - Ngày pháp lý hiện tại dạng `YYYY-MM-DD` theo múi giờ Việt Nam.
 * @returns `true` khi ngày hết hạn đã qua; không tự quyết định quyền lợi hoặc mức thanh toán.
 * @remarks Cảnh báo này chỉ phục vụ UI, không tạo field error hay chặn tiếp nhận tự chi trả; backend
 * và nghiệp vụ thanh toán vẫn quyết định BHYT.
 */
export function isInsuranceExpired(expiryDate: string, legalDate: string): boolean {
  return expiryDate !== '' && expiryDate < legalDate;
}

/**
 * Giá trị mặc định cho form tạo bệnh nhân mới; các chuỗi ngày rỗng chờ người dùng nhập ISO date.
 * @remarks `privacyNoticeAccepted` bắt đầu là `false` và phải được backend chấp nhận là `true` khi gửi hồ sơ.
 */
export const emptyNewPatientForm = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male' as const,
  phoneNumber: '',
  phoneNumberUnavailableReason: '',
  identityCardNumber: '',
  address: '',
  healthInsuranceCode: '',
  healthInsuranceExpiryDate: '',
  privacyNoticeAccepted: false,
};
