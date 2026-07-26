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

  it('allows nurse to load and operate the inpatient vitals queue', () => {
    expect(getAllowedRoles('inpatient.read')).toContain('nurse');
    expect(getAllowedRoles('queue_ticket.call')).toContain('nurse');
    expect(isActionAllowed(['nurse'], 'inpatient.read')).toBe(true);
    expect(isActionAllowed(['nurse'], 'queue_ticket.call')).toBe(true);
  });

  it('allows nurse to manage beds and execute discharge workflow after doctor approval', () => {
    expect(getAllowedRoles('bed.assign')).toEqual(['nurse']);
    expect(getAllowedRoles('bed.change')).toEqual(['nurse']);
    expect(getAllowedRoles('discharge.execute')).toEqual(['nurse']);
    expect(getAllowedRoles('discharge_summary.sign')).toEqual(['doctor']);
    expect(isActionAllowed(['nurse'], 'bed.assign')).toBe(true);
    expect(isActionAllowed(['nurse'], 'bed.change')).toBe(true);
    expect(isActionAllowed(['nurse'], 'discharge.execute')).toBe(true);
    expect(isActionAllowed(['nurse'], 'discharge_summary.sign')).toBe(false);
    expect(isActionAllowed(['doctor'], 'discharge_summary.sign')).toBe(true);
  });

  it('allows nurse to execute and cancel treatment orders in Lane 6', () => {
    expect(getAllowedRoles('treatment_order.read')).toContain('nurse');
    expect(getAllowedRoles('treatment_order.execute')).toEqual(['nurse']);
    expect(getAllowedRoles('treatment_order.cancel')).toEqual(['nurse']);
    expect(isActionAllowed(['nurse'], 'treatment_order.execute')).toBe(true);
    expect(isActionAllowed(['nurse'], 'treatment_order.cancel')).toBe(true);
  });

  it('allows nurse to collect and hand off specimens in Lane 6', () => {
    expect(getAllowedRoles('specimen.read')).toContain('nurse');
    expect(getAllowedRoles('specimen.collect')).toEqual(['nurse']);
    expect(getAllowedRoles('specimen.handoff')).toEqual(['nurse']);
    expect(isActionAllowed(['nurse'], 'specimen.collect')).toBe(true);
    expect(isActionAllowed(['nurse'], 'specimen.handoff')).toBe(true);
  });

  it('denies vital-sign writes for unrelated clinical and back-office roles', () => {
    expect(isActionAllowed(['pharmacist'], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed(['lab_tech'], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed(['accountant'], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed([], 'vital_sign.write')).toBe(false);
    expect(isActionAllowed(['pharmacist'], 'vital_signs.record')).toBe(false);
    expect(isActionAllowed(['lab_tech'], 'specimen.collect')).toBe(false);
    expect(isActionAllowed(['lab_tech'], 'bed.assign')).toBe(false);
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
