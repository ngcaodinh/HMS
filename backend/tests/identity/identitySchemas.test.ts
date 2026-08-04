import { afterEach, describe, expect, it, vi } from 'vitest';

import { mapErrorDetailsToFields } from '../../src/core/http/AppError';
import {
  changePasswordSchema,
  createSessionSchema,
  createStaffSchema,
  listStaffSchema,
  resetPasswordSchema,
  updateStaffSchema,
} from '../../src/modules/identity/identitySchemas';

const validCreateStaffInput = {
  dateOfBirth: '1992-02-02',
  departmentId: 'it',
  fullName: 'Managed Staff',
  gender: 'female',
  identityCardNumber: '001199200003',
  phoneNumber: '0901234569',
  roleCodes: ['doctor'],
  username: 'doctor.managed',
};

describe('createSessionSchema', () => {
  it('accepts the optional remember flag as a boolean', () => {
    expect(
      createSessionSchema.parse({
        password: 'secret',
        remember: true,
        username: 'it.tech.dev',
      }),
    ).toMatchObject({ remember: true });
  });

  it('rejects a non-boolean remember value', () => {
    expect(
      createSessionSchema.safeParse({
        password: 'secret',
        remember: 'true',
        username: 'it.tech.dev',
      }).success,
    ).toBe(false);
  });
});

describe('createStaffSchema', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a create staff payload without supportRequestReference', () => {
    expect(createStaffSchema.parse(validCreateStaffInput)).toMatchObject(validCreateStaffInput);
  });

  it('trims username and fullName before handing data to the service', () => {
    expect(
      createStaffSchema.parse({
        ...validCreateStaffInput,
        fullName: '  Managed Staff  ',
        username: '  doctor.managed  ',
      }),
    ).toMatchObject({
      fullName: 'Managed Staff',
      username: 'doctor.managed',
    });
  });

  it('rejects fields outside the create staff API contract', () => {
    const result = createStaffSchema.safeParse({
      ...validCreateStaffInput,
      supportRequestReference: 'REQ-20260725-001',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)).toMatchObject({
        code: 'unrecognized_keys',
        keys: ['supportRequestReference'],
      });
    }
  });

  it('rejects impossible and future dateOfBirth values with field-level messages', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T08:00:00.000Z'));

    const impossibleDate = createStaffSchema.safeParse({
      ...validCreateStaffInput,
      dateOfBirth: '2026-02-31',
    });
    const futureDate = createStaffSchema.safeParse({
      ...validCreateStaffInput,
      dateOfBirth: '2026-07-26',
    });

    expect(impossibleDate.success).toBe(false);
    expect(futureDate.success).toBe(false);
    if (!impossibleDate.success && !futureDate.success) {
      expect(impossibleDate.error.issues.at(0)).toMatchObject({
        message: 'Ngày sinh không hợp lệ',
        path: ['dateOfBirth'],
      });
      expect(futureDate.error.issues.at(0)).toMatchObject({
        message: 'Ngày sinh không được ở tương lai',
        path: ['dateOfBirth'],
      });
    }
  });

  it('reports validation issues on username, phoneNumber, and identityCardNumber', () => {
    const result = createStaffSchema.safeParse({
      ...validCreateStaffInput,
      identityCardNumber: '123',
      phoneNumber: '0123456789',
      username: 'no space',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual([
        'identityCardNumber',
        'phoneNumber',
        'username',
      ]);
    }
  });

  it('enforces a single role code from the canonical RBAC catalog', () => {
    expect(
      createStaffSchema.safeParse({
        ...validCreateStaffInput,
        roleCodes: ['doctor', 'nurse'],
      }).success,
    ).toBe(false);
    expect(
      createStaffSchema.safeParse({
        ...validCreateStaffInput,
        roleCodes: ['super_user'],
      }).success,
    ).toBe(false);
  });
});

describe('updateStaffSchema', () => {
  it('accepts only updateable staff fields and keeps supported values', () => {
    expect(
      updateStaffSchema.parse({
        dateOfBirth: '1992-02-02',
        departmentId: 'laboratory',
        fullName: 'Lab Tech Updated',
        gender: 'female',
        identityCardNumber: '001199200003',
        isActive: false,
        phoneNumber: '0907654321',
        roleCodes: ['lab_tech'],
        username: 'lab.tech.updated',
      }),
    ).toEqual({
      dateOfBirth: '1992-02-02',
      departmentId: 'laboratory',
      fullName: 'Lab Tech Updated',
      gender: 'female',
      identityCardNumber: '001199200003',
      isActive: false,
      phoneNumber: '0907654321',
      roleCodes: ['lab_tech'],
      username: 'lab.tech.updated',
    });
  });

  it('rejects credential and support reference fields outside the update contract', () => {
    const result = updateStaffSchema.safeParse({
      password: 'Secret#2026',
      supportRequestReference: 'REQ-20260725-001',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const firstIssue = result.error.issues.at(0);

      expect(firstIssue).toMatchObject({
        code: 'unrecognized_keys',
      });
      expect(firstIssue && 'keys' in firstIssue ? firstIssue.keys : []).toEqual(
        expect.arrayContaining(['password', 'supportRequestReference']),
      );
    }
  });

  it('reports validation issues on editable identity fields', () => {
    const result = updateStaffSchema.safeParse({
      dateOfBirth: '2026-02-31',
      gender: 'other',
      identityCardNumber: '123',
      username: 'changed username',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.')).sort()).toEqual([
        'dateOfBirth',
        'gender',
        'identityCardNumber',
        'username',
      ]);
    }
  });
});

describe('resetPasswordSchema', () => {
  it('trims and accepts a clear audit reason', () => {
    expect(
      resetPasswordSchema.parse({
        reason: '  Người dùng yêu cầu cấp lại mật khẩu qua IT  ',
      }),
    ).toEqual({
      reason: 'Người dùng yêu cầu cấp lại mật khẩu qua IT',
    });
  });

  it('rejects short reset reasons', () => {
    expect(resetPasswordSchema.safeParse({ reason: 'ngắn' }).success).toBe(false);
  });
});

describe('listStaffSchema', () => {
  it('coerces pagination and boolean filters from query strings', () => {
    expect(
      listStaffSchema.parse({
        departmentId: 'it',
        isActive: 'false',
        page: '2',
        pageSize: '50',
        q: '  nurse  ',
      }),
    ).toEqual({
      departmentId: 'it',
      isActive: false,
      page: 2,
      pageSize: 50,
      q: 'nurse',
    });
  });
});

describe('changePasswordSchema', () => {
  it('enforces password complexity at the HTTP boundary', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Current#2026',
        newPassword: 'weak-password',
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'Current#2026',
        newPassword: 'Strong#2026',
      }).success,
    ).toBe(true);
  });
});

describe('mapErrorDetailsToFields', () => {
  it('keeps details and exposes a frontend-readable field error map', () => {
    expect(
      mapErrorDetailsToFields([
        { field: 'username', message: 'Tên đăng nhập đã tồn tại', rule: 'unique' },
        { field: 'identityCardNumber', message: 'CCCD đã tồn tại', rule: 'unique' },
      ]),
    ).toEqual({
      identityCardNumber: ['CCCD đã tồn tại'],
      username: ['Tên đăng nhập đã tồn tại'],
    });
  });

  it('groups repeated field messages and supplies a safe fallback message', () => {
    expect(
      mapErrorDetailsToFields([
        { field: 'username', message: 'Username quá ngắn', rule: 'too_small' },
        { field: 'username', rule: 'invalid_string' },
        { rule: 'custom' },
      ]),
    ).toEqual({
      username: ['Username quá ngắn', 'Dữ liệu không hợp lệ'],
    });
  });

  it('returns undefined when details are not tied to fields', () => {
    expect(mapErrorDetailsToFields([{ rule: 'custom' }])).toBeUndefined();
    expect(mapErrorDetailsToFields()).toBeUndefined();
  });
});
