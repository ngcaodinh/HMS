export type DispensablePrescriptionStatus = 'active' | 'xml_exported';

export interface DispensablePrescriptionItem {
  prescriptionItemId: string;
  medicineNameSnapshot: string | null;
  activeIngredientSnapshot: string | null;
  dosageSnapshot: string | null;
  quantity: number;
  days: number;
  dosePerUse?: string | null;
  useTiming?: string | null;
  dosageInstruction: string;
}

export interface DispensablePrescription {
  prescriptionId: string;
  prescriptionCode: string | null;
  status: DispensablePrescriptionStatus;
  signedAt: string | null;
  dispensedAt: string | null;
  allergyOverrideReason: string | null;
  allergyOverrideAt: string | null;
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: 'male' | 'female';
    allergies: string | null;
    healthInsuranceCode: string | null;
  };
  department: { name: string } | null;
  prescribingDoctor: { fullName: string };
  diagnosis: { icd10: string; diagnosisText: string | null } | null;
  items: DispensablePrescriptionItem[];
  version: number;
}
