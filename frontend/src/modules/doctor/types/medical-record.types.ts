export type RecordStatus = 'open' | 'waiting_results' | 'diagnosed' | 'closed';
export type TreatmentType = 'outpatient' | 'inpatient';
export type ItchSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface WorklistItem {
  recordId: string;
  recordCode: string;
  patient: { patientId: string; fullName: string; dateOfBirth: string; gender: 'male' | 'female' };
  chiefComplaint: string | null;
  status: RecordStatus;
}

export interface RecordPatient {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  allergies: string | null;
  healthInsuranceCode: string | null;
}

export interface ClinicalAssessment {
  heightCm: string | null;
  weightKg: string | null;
  historyOfPresentIllness: string | null;
  pastMedicalHistory: string | null;
  familyHistory: string | null;
  skinLesionTypes: string[];
  skinLesionDescription: string | null;
  skinLesionLocation: string | null;
  skinLesionDistribution: string | null;
  bodySurfaceAreaPercent: string | null;
  itchSeverity: ItchSeverity | null;
}

export interface LatestVitalSigns {
  pulse: number;
  temperatureC: number | null;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate: number | null;
  spo2: number;
  weightKg: number | null;
}

export interface RecordLabTestSummary {
  labTestId: string;
  status: 'ordered' | 'resulted';
  testName: string;
  isUrgent: boolean;
  resultTableKey: string;
}

export interface RecordDiagnosis {
  icd10: string;
  icdCodingSystem: string;
  diagnosisText: string;
  treatmentType: TreatmentType;
  diagnosedAt: string;
  diagnosisSignedAt: string;
}

export interface MedicalRecordDetail {
  recordId: string;
  status: RecordStatus;
  version: number;
  patientId: string;
  doctorId: string;
  isEmergency: boolean;
  chiefComplaint: string | null;
  patient: RecordPatient;
  clinicalAssessment: ClinicalAssessment;
  latestVitalSigns: LatestVitalSigns | null;
  labTests: RecordLabTestSummary[];
  diagnosis: RecordDiagnosis | null;
}

export interface Icd10Entry {
  code: string;
  name: string;
  codingSystem: string;
  effectiveFrom: string;
}

export interface LabTestTypeOption {
  labTestTypeId: string;
  code: string;
  name: string;
  price: string;
  specimen: string | null;
}

export interface VitalSignsFormInput {
  pulse: number;
  temperatureC?: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate?: number;
  spo2: number;
  weightKg?: number;
}

export interface DiagnoseInput {
  expectedVersion: number;
  icd10: string;
  diagnosisText: string;
  treatmentType: TreatmentType;
}
