import { apiClient, type ApiSuccess } from '@/shared/api-client/api-client';

import type {
  CreateReceptionResponse,
  DoctorOption,
  NewPatientForm,
  PatientSearchResult,
} from '../types/reception.types';

/**
 * Search patients — đúng một trong fullName | phoneNumber | identityCardNumber.
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

export async function listReceptionDoctors(): Promise<DoctorOption[]> {
  const response = await apiClient.get<ApiSuccess<DoctorOption[]>>('/receptions/doctors');
  return response.data.data;
}

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
    privacyNoticeAccepted: true;
  };
  chiefComplaint?: string;
}): Promise<CreateReceptionResponse> {
  const response = await apiClient.post<ApiSuccess<CreateReceptionResponse>>(
    '/receptions',
    body,
  );
  return response.data.data;
}
