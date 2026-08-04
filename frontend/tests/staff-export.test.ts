import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildStaffUsersCsv } from '../src/modules/it/api/staff-export';

describe('buildStaffUsersCsv', () => {
  it('exports visible account fields and excludes secrets/identity-card data', () => {
    const csv = buildStaffUsersCsv(
      [
        {
          authVersion: 1,
          createdAt: '2026-07-24T08:00:00.000Z',
          dateOfBirth: '1992-02-02T00:00:00.000Z',
          departmentId: 'clinical',
          fullName: 'Nguyễn Văn, A',
          gender: 'male',
          id: 'user-1',
          identityCardNumber: '001199200003',
          isActive: true,
          lastLoginAt: null,
          mustChangePassword: true,
          phoneNumber: '0901234569',
          roleCodes: ['doctor'],
          updatedAt: '2026-07-24T08:00:00.000Z',
          username: 'doctor.a',
        },
      ],
      { clinical: 'Khoa Lâm sàng' },
      { doctor: 'Bác sĩ' },
    );

    assert.match(csv, /"Nguyễn Văn, A"/);
    assert.match(csv, /"Khoa Lâm sàng"/);
    assert.doesNotMatch(csv, /001199200003/);
    assert.doesNotMatch(csv, /password|mustChangePassword/i);
  });
});
