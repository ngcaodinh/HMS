export type PrescriptionType = 'C' | 'N' | 'H';
export type PrescriptionStatus = 'draft' | 'active' | 'xml_exported' | 'cancelled';

export interface PrescriptionItemInput {
  medicineId: string;
  quantity: number;
  days: number;
  dosePerUse: string;
  usesPerDay?: number;
  useTiming: string;
  dosageInstruction: string;
}

export interface CreatePrescriptionDraftInput {
  expectedRecordVersion: number;
  prescriptionType?: PrescriptionType;
  items: PrescriptionItemInput[];
  noDrugConfirmation?: boolean;
  longTermReason?: string;
  allergyOverrideReason?: string;
}

export interface SignPrescriptionInput {
  expectedVersion: number;
  signatureConfirmation: true;
  signatureMethod: 'dev_e_confirmation';
  allergyOverrideReason?: string;
}

export interface CancelPrescriptionInput {
  expectedVersion: number;
  cancelReason: string;
}
