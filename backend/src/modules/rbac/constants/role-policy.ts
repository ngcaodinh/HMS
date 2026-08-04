/**
 * Static role→action policy map (Gate G1 "role-only v1" decision — the SQL schema only has
 * `permissions(userId, roleCode)`, no `role_permissions` action table yet). Every protected
 * route declares one action code here; `authorizeAndAudit()` denies by default for unknown
 * actions or roles not listed.
 */
export const ROLE_POLICY: Record<string, string[]> = {
  // Director dashboard (Lane 14.2)
  'director.dashboard.read': ['director'],

  // Clinical EMR (Lane 3)
  'medical_record.worklist.read': ['doctor'],
  'medical_record.read': ['doctor', 'nurse', 'lab_tech', 'pharmacist', 'accountant'],
  'vital_sign.write': ['doctor', 'nurse'],
  'vital_signs.record': ['doctor', 'nurse'],
  'clinical_assessment.write': ['doctor'],
  'lab_test.order.write': ['doctor'],
  'icd10.read': ['doctor'],
  'diagnosis.write': ['doctor'],

  // Inpatient nursing (Lane 6)
  'inpatient.read': ['doctor', 'nurse'],
  'bed.assign': ['nurse'],
  'bed.change': ['nurse'],
  'queue_ticket.call': ['nurse'],
  'patient_identity.standardize': ['nurse', 'receptionist'],
  'treatment_order.read': ['doctor', 'nurse'],
  'treatment_order.create': ['doctor'],
  'treatment_order.execute': ['nurse'],
  'treatment_order.cancel': ['nurse'],
  'discharge_summary.sign': ['doctor'],
  'discharge.execute': ['nurse'],
  'specimen.read': ['nurse', 'lab_tech'],
  'specimen.collect': ['nurse'],
  'specimen.handoff': ['nurse'],

  // Laboratory & File (Lane 4)
  'lab_test.read_worklist': ['lab_tech'],
  'lab_test.result.write': ['lab_tech'],
  'lab_test.read': ['doctor', 'lab_tech'],
  'attachment.upload': ['doctor', 'lab_tech', 'pharmacist'],
  'attachment.download': ['doctor', 'lab_tech', 'pharmacist'],
  'catalog.lab_type.manage': ['admin'],
  'catalog.lab_type.read': ['doctor', 'lab_tech', 'admin'],
  'lab_test.stats.read': ['lab_tech', 'admin'],

  // Pharmacy & Prescription (Lane 5)
  'medicine.read': ['doctor', 'pharmacist', 'admin'],
  'medicine.manage': ['pharmacist', 'admin'],
  'prescription.create': ['doctor'],
  'prescription.sign': ['doctor'],
  'prescription.cancel': ['doctor', 'pharmacist', 'admin'],
  'prescription.export': ['doctor', 'pharmacist', 'admin'],
  'prescription.read': ['doctor', 'pharmacist', 'admin'],
  'prescription.dispense.read': ['pharmacist', 'admin'],
  'prescription.dispense': ['pharmacist', 'admin'],
  'pharmacy.inventory.read': ['pharmacist', 'admin'],
  'pharmacy.inventory.manage': ['pharmacist', 'admin'],
  'pharmacy.report.read': ['pharmacist', 'admin'],
};

export function getAllowedRoles(action: string): string[] {
  return ROLE_POLICY[action] ?? [];
}
