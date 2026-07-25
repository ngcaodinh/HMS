import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { PrismaIdentityRepository } from '../../src/modules/identity/IdentityRepository';

const createUniqueConstraintError = (target: unknown) =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    clientVersion: '5.20.0',
    code: 'P2002',
    meta: {
      target,
    },
  });

const createRepositoryThrowingError = (error: unknown) =>
  new PrismaIdentityRepository({
    user: {
      create: async () => {
        await Promise.resolve();
        throw error;
      },
    },
  } as unknown as PrismaClient);

const createRepositoryThrowingUniqueError = (target: unknown) =>
  createRepositoryThrowingError(createUniqueConstraintError(target));

const createRepositoryThrowingUpdateUniqueError = (target: unknown) =>
  new PrismaIdentityRepository({
    user: {
      update: async () => {
        await Promise.resolve();
        throw createUniqueConstraintError(target);
      },
    },
  } as unknown as PrismaClient);

const createStaffInput = {
  assignedBy: '11111111-1111-4111-8111-111111111111',
  data: {
    dateOfBirth: new Date('1992-02-02T00:00:00.000Z'),
    departmentId: 'it',
    fullName: 'Managed Staff',
    gender: 'female' as const,
    identityCardNumber: '001199200003',
    phoneNumber: '0901234569',
    roleCodes: ['doctor' as const],
    username: 'doctor.managed',
  },
  passwordHash: '$2a$12$newhash',
};

describe('PrismaIdentityRepository.createStaffUser', () => {
  it('keeps roleCodes out of the users create payload and writes permissions separately', async () => {
    let capturedArgs: Prisma.UserCreateArgs | undefined;
    const repository = new PrismaIdentityRepository({
      user: {
        create: (args: Prisma.UserCreateArgs) => {
          capturedArgs = args;
          return Promise.resolve({
            ...createStaffInput.data,
            authVersion: 1,
            createdAt: new Date('2026-07-24T08:00:00.000Z'),
            id: '33333333-3333-4333-8333-333333333333',
            isActive: true,
            lastLoginAt: null,
            mustChangePassword: true,
            password: createStaffInput.passwordHash,
            permissions: [
              {
                assignedAt: new Date('2026-07-24T08:00:00.000Z'),
                assignedBy: createStaffInput.assignedBy,
                id: '44444444-4444-4444-8444-444444444444',
                roleCode: 'doctor',
                userId: '33333333-3333-4333-8333-333333333333',
              },
            ],
            updatedAt: new Date('2026-07-24T08:00:00.000Z'),
          });
        },
      },
    } as unknown as PrismaClient);

    const result = await repository.createStaffUser(createStaffInput);
    const createData = capturedArgs?.data as
      | {
          permissions?: {
            create?: Array<{
              assignedBy?: string;
              roleCode?: string;
            }>;
          };
          roleCodes?: unknown;
        }
      | undefined;

    expect(result.roleCodes).toEqual(['doctor']);
    expect(createData).not.toHaveProperty('roleCodes');
    expect(createData?.permissions?.create).toEqual([
      expect.objectContaining({
        assignedBy: createStaffInput.assignedBy,
        roleCode: 'doctor',
      }),
    ]);
  });

  it('maps duplicate username array targets to a field-specific AppError', async () => {
    const repository = createRepositoryThrowingUniqueError(['username']);

    await expect(repository.createStaffUser(createStaffInput)).rejects.toMatchObject({
      code: 'STAFF_USERNAME_EXISTS',
      details: [{ field: 'username', rule: 'unique' }],
      status: 409,
    });
  });

  it('maps duplicate username string targets to a field-specific AppError', async () => {
    const repository = createRepositoryThrowingUniqueError('unique_key_users_username');

    await expect(repository.createStaffUser(createStaffInput)).rejects.toMatchObject({
      code: 'STAFF_USERNAME_EXISTS',
      details: [{ field: 'username', rule: 'unique' }],
      status: 409,
    });
  });

  it('maps duplicate identityCardNumber array targets to a field-specific AppError', async () => {
    const repository = createRepositoryThrowingUniqueError(['identityCardNumber']);

    await expect(repository.createStaffUser(createStaffInput)).rejects.toMatchObject({
      code: 'STAFF_IDENTITY_CARD_EXISTS',
      details: [{ field: 'identityCardNumber', rule: 'unique' }],
      status: 409,
    });
  });

  it('maps duplicate identity card SQL index targets to a field-specific AppError', async () => {
    const repository = createRepositoryThrowingUniqueError('unique_key_users_identity_card');

    await expect(repository.createStaffUser(createStaffInput)).rejects.toMatchObject({
      code: 'STAFF_IDENTITY_CARD_EXISTS',
      details: [{ field: 'identityCardNumber', rule: 'unique' }],
      status: 409,
    });
  });

  it('rethrows unknown P2002 targets so unexpected database constraints remain visible', async () => {
    const error = createUniqueConstraintError(['email']);
    const repository = createRepositoryThrowingError(error);

    await expect(repository.createStaffUser(createStaffInput)).rejects.toBe(error);
  });

  it('rethrows non-unique Prisma errors unchanged', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Foreign key failed', {
      clientVersion: '5.20.0',
      code: 'P2003',
    });
    const repository = createRepositoryThrowingError(error);

    await expect(repository.createStaffUser(createStaffInput)).rejects.toBe(error);
  });
});

describe('PrismaIdentityRepository.updateStaffUser', () => {
  it('maps duplicate username updates to a field-specific AppError', async () => {
    const repository = createRepositoryThrowingUpdateUniqueError(['username']);

    await expect(
      repository.updateStaffUser({
        data: {
          username: 'doctor.duplicate',
        },
        userId: '33333333-3333-4333-8333-333333333333',
      }),
    ).rejects.toMatchObject({
      code: 'STAFF_USERNAME_EXISTS',
      details: [{ field: 'username', rule: 'unique' }],
      status: 409,
    });
  });

  it('maps duplicate identity card updates to a field-specific AppError', async () => {
    const repository = createRepositoryThrowingUpdateUniqueError(['identityCardNumber']);

    await expect(
      repository.updateStaffUser({
        data: {
          identityCardNumber: '001199200003',
        },
        userId: '33333333-3333-4333-8333-333333333333',
      }),
    ).rejects.toMatchObject({
      code: 'STAFF_IDENTITY_CARD_EXISTS',
      details: [{ field: 'identityCardNumber', rule: 'unique' }],
      status: 409,
    });
  });
});
