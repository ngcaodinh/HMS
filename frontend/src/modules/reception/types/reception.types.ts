/** Giá trị giới tính được backend dùng cho form tiếp nhận và nhánh cấp cứu. */
export type Gender = 'male' | 'female';

/**
 * Kết quả tra cứu bệnh nhân được phép dùng ở màn hình reception.
 * @remarks Backend trả họ tên, SĐT và CCCD ở dạng đã mask; `dateOfBirth` dùng định dạng `YYYY-MM-DD`.
 */
export type PatientSearchResult = {
  patientId: string;
  patientCode: string;
  fullName: string;
  /** Ngày sinh dạng `YYYY-MM-DD`; giá trị được dùng để điền lại form, không phải hồ sơ y tế đầy đủ. */
  dateOfBirth: string;
  /** SĐT đã mask từ backend, hoặc `null` khi hồ sơ không có dữ liệu hiển thị. */
  phoneNumberMasked: string | null;
  /** CCCD đã mask từ backend, hoặc `null`; không dùng kết quả tra cứu để suy đoán số đầy đủ. */
  identityCardNumberMasked: string | null;
};

/** Tùy chọn bác sĩ đang hoạt động do API reception trả về để chọn người khám. */
export type DoctorOption = {
  id: string;
  fullName: string;
  employeeCode: string;
};

/**
 * Bản nháp dữ liệu hành chính của bệnh nhân mới trước khi tạo lượt tiếp nhận.
 * @remarks Ngày sinh và ngày hết hạn BHYT dùng `YYYY-MM-DD`; chuỗi rỗng nghĩa là chưa nhập.
 * Số điện thoại có thể để trống khi có lý do hợp lệ; frontend chỉ hỗ trợ UX và backend vẫn validate.
 */
export type NewPatientForm = {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  phoneNumberUnavailableReason: string;
  identityCardNumber: string;
  address: string;
  healthInsuranceCode: string;
  /** Ngày hết hạn thẻ BHYT dạng `YYYY-MM-DD`, để trống khi chưa khai báo. */
  healthInsuranceExpiryDate: string;
  /** Phải được xác nhận trước khi backend tạo hồ sơ bệnh nhân mới. */
  privacyNoticeAccepted: boolean;
};

/**
 * Kết quả backend trả sau khi tạo tiếp nhận thường thành công.
 * @remarks Các `status`, `version` và cờ emergency do backend quyết định; `fee` là chuỗi thập phân
 * hai chữ số từ phí dịch vụ server, frontend không tự định giá hoặc làm tròn lại.
 */
export type CreateReceptionResponse = {
  patient: {
    patientId: string;
    patientCode: string;
    isEmergencyBypass: boolean;
    version: number;
  };
  medicalRecord: {
    recordId: string;
    recordCode: string;
    status: string;
    doctorId: string;
    version: number;
  };
  serviceOrder: {
    serviceOrderId: string;
    /** Phí dạng chuỗi thập phân 2 chữ số do backend trả về; không phải input để client tự tính. */
    fee: string;
    status: string;
  };
  queueTicket: {
    ticketId: string;
    status: string;
    /** Timestamp ISO từ backend; có thể `null` nếu trạng thái chưa ghi nhận thời điểm tương ứng. */
    calledAt: string | null;
    servedAt: string | null;
  };
};
