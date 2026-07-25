export type PatientSearchResultDto = {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumberMasked: string | null;
  identityCardNumberMasked: string | null;
};

export type PatientSummaryDto = {
  patientId: string;
  patientCode: string;
  isEmergencyBypass: boolean;
  version: number;
};
