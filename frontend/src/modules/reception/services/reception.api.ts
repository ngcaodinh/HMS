import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

import type {
  CreateReceptionResponse,
  DoctorOption,
  NewPatientForm,
  PatientSearchResult,
} from '../types/reception.types';

/**
 * Tra cứu bệnh nhân qua backend `GET /api/v1/patients` (adapter path `/patients`) và chuẩn hóa
 * response pagination cho màn hình reception.
 * @param params - Gửi đúng một trong `fullName`, `phoneNumber` hoặc `identityCardNumber`; backend
 * giới hạn lần lượt 255, 15 và 12 ký tự/chữ số. `page` bắt đầu từ 1, `pageSize` mặc định là 20.
 * @returns Danh sách kết quả đã được backend mask cùng pagination; dùng fallback một trang nếu
 * response không có metadata pagination.
 * @remarks Request đi qua BFF với permission `patient.search`. Backend giới hạn query và là nguồn
 * validation cuối cùng; lỗi envelope được `apiClient` chuyển thành `ApiError`, còn lỗi mạng được
 * chuyển tiếp cho caller.
 */
export async function searchPatients(params: {
  fullName?: string;
  phoneNumber?: string;
  identityCardNumber?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: PatientSearchResult[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get<ApiSuccess<PatientSearchResult[]>>('/patients', {
    params: {
      fullName: params.fullName,
      phoneNumber: params.phoneNumber,
      identityCardNumber: params.identityCardNumber,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    },
  });

  return {
    items: response.data.data,
    pagination: response.data.pagination ?? {
      page: 1,
      pageSize: 20,
      totalItems: response.data.data.length,
      totalPages: 1,
    },
  };
}

/**
 * Lấy danh sách bác sĩ đang hoạt động cho combobox người khám.
 * @returns Mảng `DoctorOption` từ `response.data.data`.
 * @remarks Gọi backend `GET /api/v1/receptions/doctors` qua adapter path `/receptions/doctors`,
 * yêu cầu permission `reception.create`; lỗi envelope được chuẩn hóa thành `ApiError`, còn lỗi mạng
 * được trả về cho caller xử lý trạng thái error.
 */
export async function listReceptionDoctors(): Promise<DoctorOption[]> {
  const response = await apiClient.get<ApiSuccess<DoctorOption[]>>('/receptions/doctors');
  return response.data.data;
}

/**
 * Dữ liệu backend trả sau khi tạo lượt tiếp nhận cấp cứu.
 * @remarks Nhánh này tạo bệnh nhân tạm và bệnh án `isEmergency`, bật `isEmergencyBypass` và không
 * tạo queue ticket; bypass chỉ áp dụng thủ tục định danh, không thay thế permission backend.
 */
export type EmergencyAdmissionResponse = {
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    gender: 'male' | 'female';
    isEmergencyBypass: boolean;
  };
  medicalRecord: {
    recordId: string;
    recordCode: string;
    status: string;
    doctorId: string;
    isEmergency: boolean;
    emergencyReason: string | null;
  };
};

/**
 * Tạo lượt tiếp nhận cấp cứu không qua hàng đợi từ giới tính và lý do cấp cứu.
 * @param body - Payload gồm `gender`, `emergencyReason` tối thiểu 10 và tối đa 500 ký tự; bác sĩ,
 * khoa và lý do khám là tùy chọn theo contract backend.
 * @returns Dữ liệu bệnh nhân tạm và bệnh án cấp cứu từ `response.data.data`.
 * @remarks Gọi backend `POST /api/v1/receptions/emergency` qua adapter path `/receptions/emergency`,
 * với permission `emergency.create`. Backend quyết định bác sĩ trực mặc định, validation và lỗi như
 * reason không hợp lệ hoặc không có bác sĩ; envelope lỗi được chuẩn hóa thành `ApiError`.
 */
export async function createEmergencyAdmission(body: {
  gender: 'male' | 'female';
  emergencyReason: string;
  doctorId?: string;
  departmentId?: string;
  chiefComplaint?: string;
}): Promise<EmergencyAdmissionResponse> {
  const response = await apiClient.post<ApiSuccess<EmergencyAdmissionResponse>>(
    '/receptions/emergency',
    body,
  );
  return response.data.data;
}

/**
 * Chuẩn hóa danh tính của bệnh nhân đang ở trạng thái emergency bypass.
 * @param patientId - ID bệnh nhân trong path `/patients/:patientId/emergency-identity`.
 * @param body - Dữ liệu hành chính gồm ngày `YYYY-MM-DD`, SĐT 10 chữ số hoặc lý do thay thế, CCCD
 * 12 chữ số nếu có, `expectedVersion` để bảo vệ cập nhật đồng thời và cờ bảo vệ dữ liệu là `true`.
 * @returns Bản ghi danh tính đã chuẩn hóa, version mới và thời điểm `normalizedAt` dạng ISO-8601.
 * @remarks Gọi backend `PATCH /api/v1/patients/:patientId/emergency-identity` qua adapter path
 * `/patients/:patientId/emergency-identity`, với permission `emergency.identity.normalize`; backend
 * vẫn xác thực trạng thái bypass, dữ liệu và conflict version. Lỗi envelope thành `ApiError`.
 */
export async function normalizeEmergencyIdentity(
  patientId: string,
  body: {
    expectedVersion: number;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    phoneNumber?: string | null;
    phoneNumberUnavailableReason?: string | null;
    identityCardNumber?: string | null;
    address?: string | null;
    privacyNoticeAccepted: true;
  },
): Promise<{
  patientId: string;
  fullName: string;
  isEmergencyBypass: boolean;
  version: number;
  normalizedAt: string;
}> {
  const response = await apiClient.patch<
    ApiSuccess<{
      patientId: string;
      fullName: string;
      isEmergencyBypass: boolean;
      version: number;
      normalizedAt: string;
    }>
  >(`/patients/${patientId}/emergency-identity`, body);
  return response.data.data;
}

/**
 * Tạo lượt tiếp nhận thường, liên kết bệnh nhân với bác sĩ, dịch vụ và queue ticket đã gọi.
 * @param body - Payload phải có `queueTicketId`, `doctorId` và đúng một trong `existingPatientId`
 * hoặc `newPatient`; `newPatient` dùng ngày `YYYY-MM-DD` và phải chấp nhận thông báo bảo vệ dữ liệu.
 * @returns Kết quả transaction gồm bệnh nhân, bệnh án, service order và queue ticket đã cập nhật.
 * @remarks Gọi backend `POST /api/v1/receptions` qua adapter path `/receptions`, với permission
 * `reception.create`. Backend là nguồn quyết định validation, doctor/service, trạng thái ticket và
 * các lỗi 400/404/409; envelope lỗi thành `ApiError`, client không tự thay thế backend.
 */
export async function createReception(body: {
  queueTicketId: string;
  doctorId: string;
  departmentId?: string;
  consultationServiceId?: string;
  existingPatientId?: string;
  newPatient?: {
    fullName: string;
    dateOfBirth: string;
    gender: NewPatientForm['gender'];
    phoneNumber?: string | null;
    phoneNumberUnavailableReason?: string | null;
    identityCardNumber?: string | null;
    address?: string | null;
    healthInsuranceCode?: string | null;
    healthInsuranceExpiryDate?: string | null;
    privacyNoticeAccepted: boolean;
  };
  chiefComplaint?: string;
}): Promise<CreateReceptionResponse> {
  const response = await apiClient.post<ApiSuccess<CreateReceptionResponse>>('/receptions', body);
  return response.data.data;
}
