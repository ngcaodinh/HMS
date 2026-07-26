import type { NextFunction, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { authenticate, requirePrincipal } from '../../src/modules/identity/identityMiddleware';
import type { AuthenticatedRequest, StaffUserRecord } from '../../src/modules/identity/identityTypes';

const dependencyMocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('../../src/modules/identity/identityComposition', () => ({
  identityRepository: {
    findUserById: dependencyMocks.findUserById,
  },
}));

vi.mock('../../src/modules/identity/jwtPort', () => ({
  jwtPort: {
    verify: dependencyMocks.verify,
  },
}));

const now = new Date('2026-07-25T08:00:00.000Z');

// Tao request Express toi thieu co header Authorization de test middleware authVersion.
const createRequest = (authorization?: string): AuthenticatedRequest =>
  ({
    header: (name: string) => (name.toLowerCase() === 'authorization' ? authorization : undefined),
  }) as AuthenticatedRequest;

// Tao user co password hash de kiem tra middleware khong gan secret vao principal.
const createUser = (overrides: Partial<StaffUserRecord> = {}): StaffUserRecord => ({
  authVersion: 1,
  createdAt: now,
  dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
  departmentId: 'it',
  fullName: 'IT Dev',
  gender: 'male',
  id: '11111111-1111-4111-8111-111111111111',
  identityCardNumber: '001199000001',
  isActive: true,
  lastLoginAt: null,
  mustChangePassword: false,
  password: '$2a$12$abcdefghijklmnopqrstuv',
  phoneNumber: '0901234567',
  roleCodes: ['it_tech'],
  updatedAt: now,
  username: 'it.tech.dev',
  ...overrides,
});

// Chay middleware va tra loi duoc truyen vao next de testcase doc ket qua.
const runAuthenticate = async (request: AuthenticatedRequest) => {
  let nextError: unknown;
  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  await authenticate(request, {} as Response, next);

  return nextError;
};

describe('authenticate middleware', () => {
  it('rejects requests without a bearer token', async () => {
    const request = createRequest();

    await expect(runAuthenticate(request)).resolves.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
    });
  });

  it('hydrates a safe principal when token authVersion matches the current account', async () => {
    const request = createRequest('Bearer valid.jwt');
    dependencyMocks.verify.mockReturnValueOnce({
      authVersion: 1,
      userId: '11111111-1111-4111-8111-111111111111',
    });
    dependencyMocks.findUserById.mockResolvedValueOnce(createUser());

    await expect(runAuthenticate(request)).resolves.toBeUndefined();

    expect(request.principal).toMatchObject({
      authVersion: 1,
      id: '11111111-1111-4111-8111-111111111111',
      roleCodes: ['it_tech'],
    });
    expect(request.principal).not.toHaveProperty('password');
  });

  it('rejects stale tokens after authVersion is incremented by sensitive account changes', async () => {
    const request = createRequest('Bearer stale.jwt');
    dependencyMocks.verify.mockReturnValueOnce({
      authVersion: 1,
      userId: '11111111-1111-4111-8111-111111111111',
    });
    dependencyMocks.findUserById.mockResolvedValueOnce(createUser({ authVersion: 2 }));

    await expect(runAuthenticate(request)).resolves.toMatchObject({
      code: 'TOKEN_REVOKED',
      status: 401,
    });
    expect(request.principal).toBeUndefined();
  });

  it('rejects tokens for inactive staff accounts', async () => {
    const request = createRequest('Bearer inactive.jwt');
    dependencyMocks.verify.mockReturnValueOnce({
      authVersion: 1,
      userId: '11111111-1111-4111-8111-111111111111',
    });
    dependencyMocks.findUserById.mockResolvedValueOnce(createUser({ isActive: false }));

    await expect(runAuthenticate(request)).resolves.toMatchObject({
      code: 'TOKEN_REVOKED',
      status: 401,
    });
  });

  it('requires a principal before protected handlers read the actor', () => {
    let thrownError: unknown;

    try {
      requirePrincipal(createRequest('Bearer valid.jwt'));
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
    });
  });
});
