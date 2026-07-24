/**
 * Static role→action policy map (Gate G1 "role-only v1" decision — the SQL schema only has
 * `permissions(userId, roleCode)`, no `role_permissions` action table yet). Every protected
 * route declares one action code here; `authorizeAndAudit()` denies by default for unknown
 * actions or roles not listed.
 */
export const ROLE_POLICY: Record<string, string[]> = {
  // Clinical EMR (Lane 3)
  'medical_record.worklist.read': ['doctor'],
  'medical_record.read': ['doctor', 'nurse', 'lab_tech', 'pharmacist', 'accountant'],
  'vital_sign.write': ['doctor', 'nurse'],
  'clinical_assessment.write': ['doctor'],
  'lab_test.order.write': ['doctor'],
  'icd10.read': ['doctor'],
  'diagnosis.write': ['doctor'],

  // Laboratory & File (Lane 4)
  'lab_test.read_worklist': ['lab_tech'],
  'lab_test.result.write': ['lab_tech'],
  'lab_test.read': ['doctor', 'lab_tech'],
  'attachment.upload': ['doctor', 'lab_tech', 'pharmacist'],
  'attachment.download': ['doctor', 'lab_tech', 'pharmacist'],
  'catalog.lab_type.manage': ['admin', 'lab_tech'],
  'catalog.lab_type.read': ['doctor', 'lab_tech', 'admin'],

  // Pharmacy & Prescription (Lane 5)
  'medicine.read': ['doctor', 'pharmacist'],
  'medicine.manage': ['pharmacist', 'admin'],
  'prescription.create': ['doctor'],
  'prescription.sign': ['doctor'],
  'prescription.cancel': ['doctor', 'pharmacist'],
  'prescription.export': ['doctor', 'pharmacist'],
  'prescription.read': ['doctor', 'pharmacist'],
  'prescription.dispense.read': ['pharmacist'],
  'prescription.dispense': ['pharmacist'],
};

export function getAllowedRoles(action: string): string[] {
  return ROLE_POLICY[action] ?? [];
}
