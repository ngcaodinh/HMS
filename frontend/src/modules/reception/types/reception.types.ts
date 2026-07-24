export type Gender = 'male' | 'female';

export type PatientSearchResult = {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumberMasked: string | null;
  identityCardNumberMasked: string | null;
};

export type DoctorOption = {
  id: string;
  fullName: string;
  employeeCode: string;
};

export type NewPatientForm = {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  phoneNumberUnavailableReason: string;
  identityCardNumber: string;
  address: string;
  healthInsuranceCode: string;
  healthInsuranceExpiryDate: string;
  privacyNoticeAccepted: boolean;
};

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
    fee: string;
    status: string;
  };
  queueTicket: {
    ticketId: string;
    status: string;
    calledAt: string | null;
    servedAt: string | null;
  };
};
