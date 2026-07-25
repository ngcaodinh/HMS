export type RecordStatus = 'open' | 'waiting_results' | 'diagnosed' | 'closed';
export type TreatmentType = 'outpatient' | 'inpatient';
export type ItchSeverity = 'none' | 'mild' | 'moderate' | 'severe';
export type SkinLesionDistribution =
  | 'localized'
  | 'scattered'
  | 'generalized'
  | 'symmetric'
  | 'dermatomal'
  | 'flexural';

export interface WorklistQuery {
  doctorId: string;
  status?: RecordStatus;
  date?: string;
  page: number;
  pageSize: number;
}

export interface VitalSignsInput {
  pulse: number;
  temperatureC?: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate?: number;
  spo2: number;
  weightKg?: number;
  treatmentOrderId?: string;
  measuredAt?: string;
  note?: string;
}

export interface ClinicalAssessmentInput {
  expectedVersion: number;
  chiefComplaint?: string;
  heightCm?: number;
  weightKg?: number;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  skinLesionTypes?: string[];
  skinLesionDescription?: string;
  skinLesionLocation?: string;
  skinLesionDistribution?: SkinLesionDistribution;
  bodySurfaceAreaPercent?: number;
  itchSeverity?: ItchSeverity;
  notes?: string;
}

export interface OrderLabTestsInput {
  expectedRecordVersion: number;
  items: Array<{
    labTestTypeId: string;
    isUrgent?: boolean;
    specimenType?: string;
    method?: string;
  }>;
}

export interface DiagnoseRecordInput {
  expectedVersion: number;
  icd10: string;
  diagnosisText: string;
  treatmentType: TreatmentType;
  signatureConfirmation: true;
  signatureMethod: 'dev_e_confirmation';
}

export interface CreateMedicalEncounterInput {
  patientId: string;
  doctorId: string;
  departmentId: string;
  assignedBy: string;
  consultationServiceId?: string;
  queueTicketId?: string;
  chiefComplaint?: string;
  isEmergency?: boolean;
  emergencyReason?: string;
}
