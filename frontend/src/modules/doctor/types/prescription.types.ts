export type PrescriptionStatus = 'draft' | 'active' | 'xml_exported' | 'cancelled';

export interface MedicineOption {
  medicineId: string;
  name: string;
  activeIngredient: string | null;
  dosage: string | null;
  unit: string;
  unitPrice: string;
  coveredByHealthInsurance: boolean;
}

export interface PrescriptionItem {
  prescriptionItemId: string;
  medicineId: string;
  medicineNameSnapshot: string | null;
  activeIngredientSnapshot: string | null;
  quantity: number;
  days: number;
  dosePerUse?: string | null;
  usesPerDay?: number | null;
  useTiming?: string | null;
  dosageInstruction: string;
  unitPrice: string;
  total: string;
}

export interface Prescription {
  prescriptionId: string;
  recordId: string;
  status: PrescriptionStatus;
  isSigned: boolean;
  signedAt: string | null;
  xmlExportedAt: string | null;
  dispensedAt: string | null;
  dispensedBy: string | null;
  allergyOverrideReason: string | null;
  items: PrescriptionItem[];
  version: number;
}

/** Local (not-yet-submitted) prescription line — mirrors doctor.html's `rx.lines` shape. */
export interface DraftRxLine {
  medicineId: string;
  name: string;
  activeIngredient: string | null;
  quantity: number;
  days: number;
  dosePerUse: string;
  useTiming: string;
}
