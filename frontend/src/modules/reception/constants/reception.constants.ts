import type { NewPatientForm } from '../types/reception.types';

/** Regex SĐT di động VN 10 số. */
export const VN_MOBILE_PHONE_REGEX = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;

export const IDENTITY_CARD_REGEX = /^\d{12}$/;

/** Số lần gọi tối đa cho 1 ticket trước khi được phép bỏ qua (gồm lần call-next đầu). */
export const MAX_QUEUE_CALL_ATTEMPTS = 3;

export type PatientSearchQueryKind =
  'empty' | 'fullName' | 'identityCardNumber' | 'invalidNumeric' | 'phoneNumber';

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

type ReceptionFieldValidationInput = {
  form: NewPatientForm;
  doctorId: string;
  existingPatientId?: string | null;
  hasActiveTicket: boolean;
  legalDate: string;
  noPhone: boolean;
};

/** Kiểm tra ngày ISO có tồn tại thật trên lịch, không chỉ đúng định dạng chuỗi. */
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

/** Phân loại truy vấn tìm bệnh nhân theo đúng heuristic của API reception. */
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

/** Xác định cảnh báo BHYT hết hạn mà không chặn tiếp nhận tự chi trả. */
export function isInsuranceExpired(expiryDate: string, legalDate: string): boolean {
  return expiryDate !== '' && expiryDate < legalDate;
}

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
