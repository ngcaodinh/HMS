export type RecordStatus = 'open' | 'waiting_results' | 'diagnosed' | 'closed';
export type TreatmentType = 'outpatient' | 'inpatient';
export type ItchSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface WorklistItem {
  recordId: string;
  recordCode: string;
  patient: { patientId: string; fullName: string; dateOfBirth: string; gender: 'male' | 'female' };
  chiefComplaint: string | null;
  status: RecordStatus;
  hasReadyResults: boolean;
}

export interface RecordPatient {
  patientId: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  allergies: string | null;
  healthInsuranceCode: string | null;
  healthInsuranceExpiryDate: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhoneNumber: string | null;
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
  status: 'ordered' | 'in_progress' | 'resulted';
  testName: string;
  isUrgent: boolean;
  resultTableKey: string;
  specimenType: string | null;
}

export type ResultTableKey =
  'xn_cong_thuc_mau' | 'xn_nuoc_tieu' | 'xn_vi_sinh' | 'xn_mo_benh_hoc' | 'xn_hoa_sinh_mau';

export interface ReferenceRange {
  fieldKey: string;
  code: string;
  label: string;
  unit: string | null;
  lowerBound: string | null;
  upperBound: string | null;
  condition: 'all' | 'male' | 'female';
}

export interface LabTestAttachment {
  attachmentId: string;
  fileType: 'pdf' | 'png' | 'jpeg' | 'xml';
  originalName: string;
  uploadedAt: string;
}

export interface LabTestResultDetail {
  labTestId: string;
  recordId: string;
  testName: string;
  status: 'ordered' | 'in_progress' | 'resulted';
  resultTableKey: ResultTableKey;
  isUrgent: boolean;
  specimenType: string | null;
  reportCode: string | null;
  method: string | null;
  conclusion: string | null;
  resultedBy: string | null;
  resultedAt: string | null;
  signedBy: string | null;
  signedAt: string | null;
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    healthInsuranceCode: string | null;
  };
  department: { name: string } | null;
  orderingDoctor: { fullName: string };
  diagnosis: { icd10: string; diagnosisText: string | null } | null;
  structuredResult: Record<string, unknown> | null;
  referenceRanges: ReferenceRange[];
  attachments: LabTestAttachment[];
}

export interface RecordDiagnosis {
  icd10: string;
  icdCodingSystem: string;
  diagnosisText: string;
  treatmentType: TreatmentType | null;
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
  createdAt: string;
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
