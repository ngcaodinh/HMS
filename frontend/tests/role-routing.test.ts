/** Bảo vệ điều hướng theo role; route public và quyền backend là hai lớp kiểm soát riêng. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canAccessStaffPath,
  isPublicPath,
  isStaffPath,
  resolveRoleHomePath,
} from '../src/shared/auth/role-routing';

describe('resolveRoleHomePath', () => {
  it('returns the configured default URL for every supported staff role', () => {
    const cases = [
      ['admin', '/it-technician'],
      ['it_tech', '/it-technician'],
      ['director', '/director/dashboard'],
      ['receptionist', '/reception'],
      ['accountant', '/accounting'],
      ['doctor', '/doctor'],
      ['nurse', '/nurse'],
      ['lab_tech', '/lab-technician'],
      ['pharmacist', '/pharmacy'],
    ] as const;

    for (const [roleCode, expectedPath] of cases) {
      assert.equal(resolveRoleHomePath([roleCode]), expectedPath);
    }
  });

  it('uses a stable priority when the principal has multiple roles', () => {
    assert.equal(
      resolveRoleHomePath(['pharmacist', 'doctor', 'director']),
      '/director/dashboard',
    );
    assert.equal(resolveRoleHomePath(['doctor', 'admin']), '/it-technician');
  });

  it('returns null when no supported role is present', () => {
    assert.equal(resolveRoleHomePath([]), null);
    assert.equal(resolveRoleHomePath(['unknown_role']), null);
  });
});

describe('staff path role rules', () => {
  it('keeps public paths accessible without staff roles', () => {
    assert.equal(isPublicPath('/'), true);
    assert.equal(isPublicPath('/login'), true);
    assert.equal(isPublicPath('/kiosk'), true);
    assert.equal(isPublicPath('/queue-display'), true);
    assert.equal(isPublicPath('/queue-display/dermatology'), true);
    assert.equal(isStaffPath('/login'), false);
    assert.equal(isStaffPath('/queue-display/dermatology'), false);
  });

  it('allows each role to access its own staff URL', () => {
    assert.equal(isStaffPath('/doctor'), true);
    assert.equal(isStaffPath('/director/dashboard'), true);
    assert.equal(canAccessStaffPath('/it-technician', ['admin']), true);
    assert.equal(canAccessStaffPath('/it-technician', ['it_tech']), true);
    assert.equal(canAccessStaffPath('/director/dashboard', ['director']), true);
    assert.equal(canAccessStaffPath('/reception', ['receptionist']), true);
    assert.equal(canAccessStaffPath('/accounting', ['accountant']), true);
    assert.equal(canAccessStaffPath('/doctor', ['doctor']), true);
    assert.equal(canAccessStaffPath('/nurse', ['nurse']), true);
    assert.equal(canAccessStaffPath('/lab-technician', ['lab_tech']), true);
    assert.equal(canAccessStaffPath('/lab/results', ['lab_tech']), true);
    assert.equal(canAccessStaffPath('/pharmacy', ['pharmacist']), true);
  });

  it('denies authenticated staff when the URL belongs to another role', () => {
    assert.equal(canAccessStaffPath('/director/dashboard', ['doctor']), false);
    assert.equal(canAccessStaffPath('/doctor', ['nurse']), false);
    assert.equal(canAccessStaffPath('/lab', ['pharmacist']), false);
  });
});
