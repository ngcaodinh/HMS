import { describe, expect, it, vi } from 'vitest';

import { IdentityService } from '../../src/modules/identity/identityService';
import type {
  AuditPort,
  DepartmentDirectoryPort,
  IdentityRepository,
  StaffUserRecord,
} from '../../src/modules/identity/identityTypes';

const now = new Date('2026-07-24T08:00:00.000Z');

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

const createRepository = (users: StaffUserRecord[]): IdentityRepository => ({
  countActiveAdminsExcluding: vi.fn().mockResolvedValue(1),
  createStaffUser: vi.fn(async ({ data, passwordHash }) => ({
    ...createUser({
      ...data,
      id: '33333333-3333-4333-8333-333333333333',
      password: passwordHash,
      roleCodes: data.roleCodes,
    }),
  })),
  findRoleCodesForUser: vi.fn(async (userId) =>
    users.find((user) => user.id === userId)?.roleCodes ?? [],
  ),
  findUserById: vi.fn(async (userId) => users.find((user) => user.id === userId) ?? null),
  findUserByUsername: vi.fn(async (username) =>
    users.find((user) => user.username === username) ?? null,
  ),
  listStaffUsers: vi.fn(async () => ({ items: users, totalItems: users.length })),
  replaceUserRoles: vi.fn(),
  updateLastLogin: vi.fn(),
  updatePassword: vi.fn(),
  updateStaffUser: vi.fn(async ({ userId, data }) => {
    const user = users.find((item) => item.id === userId);

    if (!user) return null;

    return {
      ...user,
      ...data,
      authVersion: data.authVersion?.increment
        ? user.authVersion + data.authVersion.increment
        : user.authVersion,
      updatedAt: new Date('2026-07-24T08:05:00.000Z'),
    };
  }),
  userHasAction: vi.fn(async (_userId, actionCode) =>
    ['staff.read', 'staff.create', 'staff.update', 'staff.password.reset'].includes(actionCode),
  ),
});

const departmentDirectory: DepartmentDirectoryPort = {
  assertDepartmentExists: vi.fn().mockResolvedValue(undefined),
};

const auditPort: AuditPort = {
  record: vi.fn().mockResolvedValue(undefined),
};

const createService = (users: StaffUserRecord[]) =>
  new IdentityService({
    auditPort,
    bcrypt: {
      compare: vi.fn().mockResolvedValue(true),
      hash: vi.fn().mockResolvedValue('$2a$12$newhash'),
    },
    clock: () => now,
    departmentDirectory,
    jwt: {
      sign: vi.fn().mockReturnValue('signed.jwt'),
      verify: vi.fn(),
    },
    randomPassword: () => 'Tmp#20260724',
    repository: createRepository(users),
  });

describe('IdentityService staff policy', () => {
  it('blocks an IT technician from creating privileged staff accounts', async () => {
    const service = createService([createUser()]);

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
          roleCodes: ['admin'],
          supportRequestReference: 'REQ-20260724-001',
          username: 'admin.new',
        },
        requestId: 'req-1',
      }),
    ).rejects.toMatchObject({
      code: 'TARGET_ROLE_FORBIDDEN',
      status: 403,
    });
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
});
