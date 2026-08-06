/** Kiểm tra adapter nhân sự map đúng filter/pagination và giữ metadata response. */
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { listStaffUsers } from '../src/modules/it/api/staff-api';

const originalFetch = globalThis.fetch;

const staffUser = {
  authVersion: 1,
  createdAt: '2026-07-24T08:00:00.000Z',
  dateOfBirth: '1992-02-02T00:00:00.000Z',
  departmentId: 'clinical',
  fullName: 'Managed Staff',
  gender: 'female',
  id: '33333333-3333-4333-8333-333333333333',
  identityCardNumber: '001199200003',
  isActive: true,
  lastLoginAt: null,
  mustChangePassword: true,
  phoneNumber: '0901234569',
  roleCodes: ['doctor'],
  updatedAt: '2026-07-24T08:00:00.000Z',
  username: 'doctor.managed',
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('listStaffUsers', () => {
  it('passes pagination, search, and status filters to the staff-users API', async () => {
    let capturedInput: RequestInfo | URL | undefined;

    globalThis.fetch = ((input: RequestInfo | URL) => {
      capturedInput = input;

      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              items: [staffUser],
              page: 2,
              pageSize: 1,
              totalItems: 7,
              totalPages: 7,
            },
          }),
        ),
      );
    }) as typeof fetch;

    const result = await listStaffUsers({
      departmentId: 'clinical',
      isActive: true,
      page: 2,
      pageSize: 1,
      q: ' doctor.managed ',
      roleCode: 'doctor',
    });

    const url = new URL(String(capturedInput), 'http://localhost');

    assert.equal(url.pathname, '/api/staff-users');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('pageSize'), '1');
    assert.equal(url.searchParams.get('isActive'), 'true');
    assert.equal(url.searchParams.get('departmentId'), 'clinical');
    assert.equal(url.searchParams.get('q'), 'doctor.managed');
    assert.equal(url.searchParams.get('roleCode'), 'doctor');
    assert.equal(result.totalItems, 7);
  });
});
