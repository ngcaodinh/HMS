export type DispensablePrescriptionStatus = 'active' | 'xml_exported';

export interface FefoAllocation {
  balanceAfter: number;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityAllocated: number;
  warehouse: {
    code: string;
    name: string;
    warehouseId: string;
  };
}

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
  fefoAllocations: FefoAllocation[];
}

export interface DispensablePrescription {
  prescriptionId: string;
  prescriptionCode: string | null;
  status: DispensablePrescriptionStatus;
  signedAt: string | null;
  dispensedAt: string | null;
  dispensedBy: string | null;
  allergyOverrideReason: string | null;
  allergyOverrideAt: string | null;
  xmlExportedAt: string | null;
  warehouse: {
    code: string;
    name: string;
    warehouseId: string;
  } | null;
  patient: {
    patientId: string;
    patientCode: string;
    fullName: string;
    dateOfBirth: string;
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
