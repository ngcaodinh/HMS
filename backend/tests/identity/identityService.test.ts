import { describe, expect, it } from 'vitest';

import { IdentityService } from '../../src/modules/identity/identityService';
import type {
  AuditPort,
  BcryptPort,
  DepartmentDirectoryPort,
  IdentityRepository,
  JwtPort,
  RoleCode,
  StaffUserRecord,
} from '../../src/modules/identity/identityTypes';
import { roleCodes } from '../../src/modules/identity/identityTypes';

const now = new Date('2026-07-24T08:00:00.000Z');

// Gom cac action staff.* trong tai lieu ra mot danh sach de test ma tran RBAC.
const staffPermissionActions = [
  'staff.read',
  'staff.create',
  'staff.update',
  'staff.password.reset',
] as const;

const roleActionPolicy: Record<RoleCode, string[]> = {
  accountant: [],
  admin: [...staffPermissionActions],
  director: [],
  doctor: [],
  it_tech: [...staffPermissionActions],
  lab_tech: [],
  nurse: [],
  pharmacist: [],
  receptionist: [],
};

// Táº¡o báº£n ghi nhÃ¢n viÃªn chuáº©n Ä‘á»ƒ má»—i testcase chá»‰ override Ä‘Ãºng dá»¯ liá»‡u cáº§n kiá»ƒm tra.
const createUser = (overrides: Partial<StaffUserRecord> = {}): StaffUserRecord => ({
  id: '11111111-1111-4111-8111-111111111111',
  username: 'it.tech.dev',
  password: '$2a$12$abcdefghijklmnopqrstuv',
  fullName: 'IT Dev',
  gender: 'male',
  dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
  phoneNumber: '0901234567',
  identityCardNumber: '001199000001',
  departmentId: 'it',
  isActive: true,
  mustChangePassword: false,
  authVersion: 1,
  lastLoginAt: null,
  createdAt: now,
  updatedAt: now,
  roleCodes: ['it_tech'],
  ...overrides,
});

// Dựng repository in-memory, có thể override từng hàm để mô phỏng nhánh lỗi riêng biệt.
const createRepository = (
  users: StaffUserRecord[],
  overrides: Partial<IdentityRepository> = {},
): IdentityRepository => ({
  countActiveAdminsExcluding: () => Promise.resolve(1),
  createStaffUser: ({ data, passwordHash }) =>
    Promise.resolve({
      ...createUser({
        ...data,
        id: '33333333-3333-4333-8333-333333333333',
        password: passwordHash,
        roleCodes: data.roleCodes,
      }),
    }),
  findRoleCodesForUser: (userId) =>
    Promise.resolve(users.find((user) => user.id === userId)?.roleCodes ?? []),
  findUserById: (userId) =>
    Promise.resolve(users.find((user) => user.id === userId) ?? null),
  findUserByUsername: (username) =>
    Promise.resolve(users.find((user) => user.username === username) ?? null),
  listStaffUsers: ({ excludedRoleCodes }) => {
    const visibleUsers = excludedRoleCodes
      ? users.filter((user) =>
          user.roleCodes.every((roleCode) => !excludedRoleCodes.includes(roleCode)),
        )
      : users;

    return Promise.resolve({ items: visibleUsers, totalItems: visibleUsers.length });
  },
  replaceUserRoles: () => Promise.resolve(),
  updateLastLogin: () => Promise.resolve(),
  updatePassword: ({ mustChangePassword, passwordHash, userId }) => {
    const user = users.find((item) => item.id === userId);

    if (!user) return Promise.resolve(null);

    return Promise.resolve({
      ...user,
      authVersion: user.authVersion + 1,
      mustChangePassword,
      password: passwordHash,
      updatedAt: new Date('2026-07-24T08:05:00.000Z'),
    });
  },
  updateStaffUser: ({ userId, data }) => {
    const user = users.find((item) => item.id === userId);

    if (!user) return Promise.resolve(null);

    return Promise.resolve({
      ...user,
      ...data,
      authVersion: data.authVersion?.increment
        ? user.authVersion + data.authVersion.increment
        : user.authVersion,
      updatedAt: new Date('2026-07-24T08:05:00.000Z'),
    });
  },
  updateStaffUserWithRoles: ({ userId, data, roleCodes }) => {
    const user = users.find((item) => item.id === userId);

    if (!user) return Promise.resolve(null);

    return Promise.resolve({
      ...user,
      ...data,
      authVersion: data.authVersion?.increment
        ? user.authVersion + data.authVersion.increment
        : user.authVersion,
      roleCodes,
      updatedAt: new Date('2026-07-24T08:05:00.000Z'),
    });
  },
  userHasAction: (userId, actionCode) => {
    const user = users.find((item) => item.id === userId);

    if (!user) return Promise.resolve(false);

    return Promise.resolve(
      user.roleCodes.some((roleCode) => roleActionPolicy[roleCode].includes(actionCode)),
    );
  },
  ...overrides,
});

const departmentDirectory: DepartmentDirectoryPort = {
  assertDepartmentExists: () => Promise.resolve(),
};

const auditPort: AuditPort = {
  record: () => Promise.resolve(),
};

type CreateServiceOverrides = {
  auditPort?: AuditPort;
  bcrypt?: Partial<BcryptPort>;
  departmentDirectory?: DepartmentDirectoryPort;
  jwt?: Partial<JwtPort>;
  randomPassword?: () => string;
  repository?: Partial<IdentityRepository>;
};

// Ghép service thật với các port giả để test hành vi nghiệp vụ mà không cần database thật.
const createService = (users: StaffUserRecord[], overrides: CreateServiceOverrides = {}) =>
  new IdentityService({
    auditPort: overrides.auditPort ?? auditPort,
    bcrypt: {
      compare: () => Promise.resolve(true),
      hash: () => Promise.resolve('$2a$12$newhash'),
      ...overrides.bcrypt,
    },
    clock: () => now,
    departmentDirectory: overrides.departmentDirectory ?? departmentDirectory,
    jwt: {
      sign: () => 'signed.jwt',
      verify: () => ({
        authVersion: 1,
        userId: '11111111-1111-4111-8111-111111111111',
      }),
      ...overrides.jwt,
    },
    randomPassword: overrides.randomPassword ?? (() => 'Tmp#20260724'),
    repository: createRepository(users, overrides.repository),
  });

describe('IdentityService staff policy', () => {
  it('keeps the canonical role catalog aligned with the RBAC review document', () => {
    expect(roleCodes).toEqual([
      'admin',
      'receptionist',
      'accountant',
      'doctor',
      'nurse',
      'lab_tech',
      'pharmacist',
      'it_tech',
      'director',
    ]);
  });

  it.each(staffPermissionActions)(
    'allows only admin and IT technician to execute %s',
    async (actionCode) => {
      for (const roleCode of roleCodes) {
        const actor = createUser({
          id: `11111111-1111-4111-8111-${roleCode.padEnd(12, '0').slice(0, 12)}`,
          roleCodes: [roleCode],
          username: `${roleCode}.actor`,
        });
        const service = createService([actor]);

        if (roleActionPolicy[roleCode].includes(actionCode)) {
          await expect(service.assertAction(actor, actionCode)).resolves.toBeUndefined();
        } else {
          await expect(service.assertAction(actor, actionCode)).rejects.toMatchObject({
            code: 'FORBIDDEN',
            status: 403,
          });
        }
      }
    },
  );

  it('denies unknown staff actions by default and records the denied authorization audit', async () => {
    const actor = createUser();
    const auditEvents: Array<Parameters<AuditPort['record']>[0]> = [];
    const service = createService([actor], {
      auditPort: {
        record: (input) => {
          auditEvents.push(input);
          return Promise.resolve();
        },
      },
    });

    await expect(service.assertAction(actor, 'staff.export')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });

    expect(auditEvents.at(-1)).toMatchObject({
      action: 'authorization.denied',
      actorId: actor.id,
      reference: 'staff.export',
      resource: 'rbac',
    });
  });

  it('rejects inactive staff login with the same invalid-credential response', async () => {
    const inactiveUser = createUser({ isActive: false });
    const service = createService([inactiveUser]);

    await expect(
      service.createSession({
        password: 'Wrong#2026',
        requestId: 'req-login-inactive',
        username: inactiveUser.username,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  it('rejects wrong login passwords without exposing account state', async () => {
    const service = createService([createUser()], {
      bcrypt: {
        compare: () => Promise.resolve(false),
      },
    });

    await expect(
      service.createSession({
        password: 'Wrong#2026',
        requestId: 'req-login-wrong-password',
        username: 'it.tech.dev',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  it('blocks an IT technician from creating privileged staff accounts', async () => {
    const service = createService([createUser()]);

    for (const privilegedRoleCode of ['admin', 'it_tech', 'director'] satisfies RoleCode[]) {
      await expect(
        service.createStaffAccount({
          actor: createUser(),
          input: {
            dateOfBirth: '1992-02-02',
            departmentId: 'it',
            fullName: 'Privileged User',
            gender: 'male',
            identityCardNumber: '001199200002',
            phoneNumber: '0901234568',
            roleCodes: [privilegedRoleCode],
            supportRequestReference: 'REQ-20260724-001',
            username: `${privilegedRoleCode}.new`,
          },
          requestId: `req-create-${privilegedRoleCode}`,
        }),
      ).rejects.toMatchObject({
        code: 'TARGET_ROLE_FORBIDDEN',
        status: 403,
      });
    }
  });

  it.each(['receptionist', 'accountant', 'doctor', 'nurse', 'lab_tech', 'pharmacist'] as const)(
    'allows IT technician to create managed %s accounts with a support reference',
    async (managedRoleCode) => {
      const service = createService([createUser()]);

      const result = await service.createStaffAccount({
        actor: createUser(),
        input: {
          dateOfBirth: '1992-02-02',
          departmentId: 'it',
          fullName: 'Managed Staff',
          gender: 'female',
          identityCardNumber: '001199200003',
          phoneNumber: '0901234569',
          roleCodes: [managedRoleCode],
          supportRequestReference: 'REQ-20260725-MANAGED',
          username: `${managedRoleCode}.managed`,
        },
        requestId: `req-create-${managedRoleCode}`,
      });

      expect(result.user.roleCodes).toEqual([managedRoleCode]);
    },
  );

  it('allows admins to create privileged staff accounts without an IT support reference', async () => {
    const admin = createUser({
      id: '99999999-9999-4999-8999-999999999999',
      roleCodes: ['admin'],
      username: 'admin.root',
    });
    const service = createService([admin]);

    const result = await service.createStaffAccount({
      actor: admin,
      input: {
        dateOfBirth: '1992-02-02',
        departmentId: 'admin',
        fullName: 'Director Account',
        gender: 'male',
        identityCardNumber: '001199200005',
        phoneNumber: '0901234571',
        roleCodes: ['director'],
        username: 'director.created.by.admin',
      },
      requestId: 'req-admin-create-director',
    });

    expect(result.user.roleCodes).toEqual(['director']);
  });

  it('requires a support reference when IT creates a managed staff account', async () => {
    const service = createService([createUser()]);

    await expect(
      service.createStaffAccount({
        actor: createUser(),
        input: {
          dateOfBirth: '1992-02-02',
          departmentId: 'it',
          fullName: 'Support Doctor',
          gender: 'female',
          identityCardNumber: '001199200003',
          phoneNumber: '0901234569',
          roleCodes: ['doctor'],
          username: 'doctor.support',
        },
        requestId: 'req-create-no-ref',
      }),
    ).rejects.toMatchObject({
      code: 'SUPPORT_REFERENCE_REQUIRED',
      status: 422,
    });
  });

  it('returns a one-time temporary password without leaking the stored password hash', async () => {
    const service = createService([createUser()], {
      randomPassword: () => 'Tmp#OneTime2026',
    });

    const result = await service.createStaffAccount({
      actor: createUser(),
      input: {
        dateOfBirth: '1992-02-02',
        departmentId: 'it',
        fullName: 'Support Nurse',
        gender: 'female',
        identityCardNumber: '001199200004',
        phoneNumber: '0901234570',
        roleCodes: ['nurse'],
        supportRequestReference: 'REQ-20260724-003',
        username: 'nurse.support',
      },
      requestId: 'req-create-success',
    });

    expect(result.temporaryPassword).toBe('Tmp#OneTime2026');
    expect(result.user.mustChangePassword).toBe(false);
    expect(result.user.roleCodes).toEqual(['nurse']);
    expect(result.user).not.toHaveProperty('password');
  });

  it('increments authVersion when locking a staff account', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target]);

    const result = await service.updateStaffAccount({
      actor: createUser(),
      ifUnmodifiedSince: target.updatedAt.toISOString(),
      input: {
        isActive: false,
        supportRequestReference: 'REQ-20260724-002',
      },
      requestId: 'req-2',
      userId: target.id,
    });

    expect(result.authVersion).toBe(2);
    expect(result).not.toHaveProperty('password');
  });

  it('rejects stale staff updates when If-Unmodified-Since no longer matches', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target]);

    await expect(
      service.updateStaffAccount({
        actor: createUser(),
        ifUnmodifiedSince: '2026-07-24T07:59:59.000Z',
        input: {
          fullName: 'Doctor Stale Update',
        },
        requestId: 'req-stale-update',
        userId: target.id,
      }),
    ).rejects.toMatchObject({
      code: 'STAFF_MODIFIED_SINCE_READ',
      status: 409,
    });
  });

  it('keeps authVersion unchanged for profile-only staff updates', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target]);

    const result = await service.updateStaffAccount({
      actor: createUser(),
      ifUnmodifiedSince: target.updatedAt.toISOString(),
      input: {
        fullName: 'Doctor Profile Updated',
        phoneNumber: '0907654321',
      },
      requestId: 'req-profile-update',
      userId: target.id,
    });

    expect(result.authVersion).toBe(1);
    expect(result.fullName).toBe('Doctor Profile Updated');
    expect(result.phoneNumber).toBe('0907654321');
  });

  it('updates staff roles atomically and revokes existing sessions', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target]);

    const result = await service.updateStaffAccount({
      actor: createUser(),
      ifUnmodifiedSince: target.updatedAt.toISOString(),
      input: {
        roleCodes: ['nurse', 'pharmacist'],
        supportRequestReference: 'REQ-20260724-004',
      },
      requestId: 'req-role-update',
      userId: target.id,
    });

    expect(result.authVersion).toBe(2);
    expect(result.roleCodes).toEqual(['nurse', 'pharmacist']);
  });

  it('requires a support reference when IT changes staff status or roles', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target]);

    await expect(
      service.updateStaffAccount({
        actor: createUser(),
        ifUnmodifiedSince: target.updatedAt.toISOString(),
        input: {
          isActive: false,
        },
        requestId: 'req-status-no-ref',
        userId: target.id,
      }),
    ).rejects.toMatchObject({
      code: 'SUPPORT_REFERENCE_REQUIRED',
      status: 422,
    });
  });

  it('prevents locking the last active admin account', async () => {
    const admin = createUser({
      id: '99999999-9999-4999-8999-999999999999',
      roleCodes: ['admin'],
      username: 'admin.root',
    });
    const service = createService([admin], {
      repository: {
        countActiveAdminsExcluding: () => Promise.resolve(0),
      },
    });

    await expect(
      service.updateStaffAccount({
        actor: admin,
        ifUnmodifiedSince: admin.updatedAt.toISOString(),
        input: {
          isActive: false,
        },
        requestId: 'req-lock-last-admin',
        userId: admin.id,
      }),
    ).rejects.toMatchObject({
      code: 'LAST_ACTIVE_ADMIN',
      status: 422,
    });
  });

  it('keeps the first-login session alive with a new token after changing password', async () => {
    const actor = createUser({ mustChangePassword: true });
    const service = createService([actor]);

    const result = await service.changePassword({
      actor,
      newPassword: 'HmsNew#2026Local',
      requestId: 'req-3',
    });

    expect(result.accessToken).toBe('signed.jwt');
    expect(result.principal.mustChangePassword).toBe(false);
    expect(result.principal.authVersion).toBe(2);
    expect(result.principal).not.toHaveProperty('password');
  });

  it('requires current password when the account is not in first-login flow', async () => {
    const actor = createUser({ mustChangePassword: false });
    const service = createService([actor]);

    await expect(
      service.changePassword({
        actor,
        newPassword: 'HmsNew#2026Local',
        requestId: 'req-4',
      }),
    ).rejects.toMatchObject({
      code: 'CURRENT_PASSWORD_REQUIRED',
      status: 400,
    });
  });

  it('rejects an invalid current password during normal password change', async () => {
    const actor = createUser({ mustChangePassword: false });
    const service = createService([actor], {
      bcrypt: {
        compare: () => Promise.resolve(false),
      },
    });

    await expect(
      service.changePassword({
        actor,
        currentPassword: 'Wrong#2026',
        newPassword: 'HmsNew#2026Local',
        requestId: 'req-invalid-current-password',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CURRENT_PASSWORD',
      status: 400,
    });
  });

  it('requires If-Unmodified-Since before updating a staff account', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target]);

    await expect(
      service.updateStaffAccount({
        actor: createUser(),
        input: {
          fullName: 'Doctor Updated',
        },
        requestId: 'req-5',
        userId: target.id,
      }),
    ).rejects.toMatchObject({
      code: 'IF_UNMODIFIED_SINCE_REQUIRED',
      status: 428,
    });
  });

  it('keeps IT staff pagination totals aligned after hiding privileged accounts', async () => {
    const actor = createUser();
    const users = [
      actor,
      ...Array.from({ length: 20 }, (_, index) =>
        createUser({
          id: `33333333-3333-4333-8333-${String(index).padStart(12, '0')}`,
          roleCodes: ['doctor'],
          username: `doctor.${index}`,
        }),
      ),
      createUser({
        id: '44444444-4444-4444-8444-444444444444',
        roleCodes: ['admin'],
        username: 'admin.hidden',
      }),
    ];
    const service = createService(users);

    const result = await service.listStaffUsers({
      actor,
      page: 1,
      pageSize: 20,
      requestId: 'req-6',
    });

    expect(result.totalItems).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(result.items.every((user) => !user.roleCodes.includes('admin'))).toBe(true);
  });

  it('hides every privileged role from IT technician staff listing scope', async () => {
    const actor = createUser();
    const service = createService([
      actor,
      createUser({
        id: '22222222-2222-4222-8222-222222222222',
        roleCodes: ['doctor'],
        username: 'doctor.visible',
      }),
      createUser({
        id: '33333333-3333-4333-8333-333333333333',
        roleCodes: ['admin'],
        username: 'admin.hidden',
      }),
      createUser({
        id: '44444444-4444-4444-8444-444444444444',
        roleCodes: ['it_tech'],
        username: 'it.hidden',
      }),
      createUser({
        id: '55555555-5555-4555-8555-555555555555',
        roleCodes: ['director'],
        username: 'director.hidden',
      }),
    ]);

    const result = await service.listStaffUsers({
      actor,
      page: 1,
      pageSize: 20,
      requestId: 'req-it-list-scope',
    });

    expect(result.items.map((user) => user.username)).toEqual(['doctor.visible']);
  });

  it('allows admins to list privileged staff accounts', async () => {
    const admin = createUser({
      id: '99999999-9999-4999-8999-999999999999',
      roleCodes: ['admin'],
      username: 'admin.root',
    });
    const hiddenFromIt = createUser({
      id: '44444444-4444-4444-8444-444444444444',
      roleCodes: ['director'],
      username: 'director.visible.to.admin',
    });
    const service = createService([admin, hiddenFromIt]);

    const result = await service.listStaffUsers({
      actor: admin,
      page: 1,
      pageSize: 20,
      requestId: 'req-admin-list',
    });

    expect(result.totalItems).toBe(2);
    expect(result.items.some((user) => user.roleCodes.includes('director'))).toBe(true);
  });

  it('blocks IT technicians from resetting privileged staff passwords', async () => {
    const privilegedUser = createUser({
      id: '44444444-4444-4444-8444-444444444444',
      roleCodes: ['admin'],
      username: 'admin.target',
    });
    const service = createService([createUser(), privilegedUser]);

    await expect(
      service.resetStaffPassword({
        actor: createUser(),
        reason: 'REQ-20260725-002 reset mật khẩu tài khoản đặc quyền',
        requestId: 'req-reset-privileged',
        userId: privilegedUser.id,
      }),
    ).rejects.toMatchObject({
      code: 'TARGET_ROLE_FORBIDDEN',
      status: 403,
    });
  });

  it('returns a reset temporary password and requires password change on next login', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const service = createService([createUser(), target], {
      randomPassword: () => 'Tmp#Reset2026',
    });

    const result = await service.resetStaffPassword({
      actor: createUser(),
      reason: 'REQ-20260725-003 reset mật khẩu hợp lệ',
      requestId: 'req-reset-success',
      userId: target.id,
    });

    expect(result.temporaryPassword).toBe('Tmp#Reset2026');
    expect(result.user.mustChangePassword).toBe(true);
    expect(result.user.authVersion).toBe(2);
    expect(result.user).not.toHaveProperty('password');
  });

  it('does not persist raw reset reasons in audit events', async () => {
    const target = createUser({
      id: '22222222-2222-4222-8222-222222222222',
      roleCodes: ['doctor'],
      username: 'doctor.one',
    });
    const auditEvents: Array<Parameters<AuditPort['record']>[0]> = [];
    const service = createService([createUser(), target], {
      auditPort: {
        record: (input) => {
          auditEvents.push(input);
          return Promise.resolve();
        },
      },
    });
    const rawReason = 'REQ-20260725-001 reset mật khẩu theo yêu cầu hỗ trợ';

    await service.resetStaffPassword({
      actor: createUser(),
      reason: rawReason,
      requestId: 'req-7',
      userId: target.id,
    });

    expect(auditEvents.at(-1)?.reference).not.toBe(rawReason);
    expect(auditEvents.at(-1)?.changedFields).toEqual([
      'password',
      'mustChangePassword',
      'authVersion',
      'reasonHash',
    ]);
  });
});
