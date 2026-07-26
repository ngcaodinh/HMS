import { describe, expect, it } from 'vitest';

import { getAllowedRoles } from '../src/modules/rbac/constants/role-policy';
import { isActionAllowed } from '../src/modules/rbac/services/rbac.service';

describe('RBAC clinical policy', () => {
  it('allows doctor and nurse to record vital signs', () => {
    expect(getAllowedRoles('vital_sign.write')).toEqual(['doctor', 'nurse']);
    expect(getAllowedRoles('vital_signs.record')).toEqual(['doctor', 'nurse']);
    expect(isActionAllowed(['doctor'], 'vital_sign.write')).toBe(true);
    expect(isActionAllowed(['nurse'], 'vital_sign.write')).toBe(true);
    expect(isActionAllowed(['doctor', 'pharmacist'], 'vital_sign.write')).toBe(true);
    expect(isActionAllowed(['doctor'], 'vital_signs.record')).toBe(true);
    expect(isActionAllowed(['nurse'], 'vital_signs.record')).toBe(true);
  });

  it('denies vital-sign writes for unrelated clinical and back-office roles', () => {
    expect(isActionAllowed(['pharmacist'], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed(['lab_tech'], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed(['accountant'], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed([], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed(['pharmacist'], 'vital_signs.record')).toBe(false);
  });

  it('keeps diagnosis and clinical assessment writes doctor-only', () => {
    for (const action of ['clinical_assessment.write', 'diagnosis.write']) {
      expect(getAllowedRoles(action)).toEqual(['doctor']);
      expect(isActionAllowed(['doctor'], action)).toBe(true);
      expect(isActionAllowed(['nurse'], action)).toBe(false);
    }
  });

  it('denies unknown actions by default', () => {
    expect(getAllowedRoles('medical_record.unknown')).toEqual([]);
    expect(isActionAllowed(['doctor'], 'medical_record.unknown')).toBe(false);
  });
});
