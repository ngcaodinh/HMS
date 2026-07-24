/** Regex SĐT di động VN 10 số. */
export const VN_MOBILE_PHONE_REGEX =
  /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-9])[0-9]{7}$/;

export const IDENTITY_CARD_REGEX = /^\d{12}$/;

/** Số lần gọi tối đa cho 1 ticket trước khi được phép bỏ qua (gồm lần call-next đầu). */
export const MAX_QUEUE_CALL_ATTEMPTS = 3;

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
  privacyNoticeAccepted: true,
};
