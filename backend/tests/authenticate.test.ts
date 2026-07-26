import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/modules/identity/identityComposition', () => ({
  identityRepository: {
    findUserById: vi.fn(),
  },
}));

vi.mock('../src/modules/identity/jwtPort', () => ({
  jwtPort: {
    verify: vi.fn(),
  },
}));

import { authenticate } from '../src/middlewares/authenticate';
import { identityRepository } from '../src/modules/identity/identityComposition';
import { jwtPort } from '../src/modules/identity/jwtPort';

const mockedIdentityRepository = vi.mocked(identityRepository);
const mockedJwtPort = vi.mocked(jwtPort);

const createResponse = () => {
  const response = {
    req: { headers: {} },
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
};

describe('legacy authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates req.user roles from identity token before legacy authorization runs', async () => {
    mockedJwtPort.verify.mockReturnValue({
      authVersion: 3,
      userId: 'usr-nurse-01',
    });
    mockedIdentityRepository.findUserById.mockResolvedValue({
      authVersion: 3,
      createdAt: new Date('2026-07-26T00:00:00.000Z'),
      dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
      departmentId: 'dept-inpatient-01',
      fullName: 'Nurse Demo',
      gender: 'female',
      id: 'usr-nurse-01',
      identityCardNumber: '001199000002',
      isActive: true,
      lastLoginAt: null,
      mustChangePassword: false,
      password: 'hashed',
      phoneNumber: '0901234568',
      roleCodes: ['nurse'],
      updatedAt: new Date('2026-07-26T00:00:00.000Z'),
      username: 'nurse.vitals.demo',
    });

    const request = {
      headers: {
        authorization: `Bearer ${jwt.sign({ authVersion: 3, userId: 'usr-nurse-01' }, 'test-secret')}`,
      },
      user: undefined,
    } as unknown as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await authenticate(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
    expect(request.user).toMatchObject({
      departmentId: 'dept-inpatient-01',
      id: 'usr-nurse-01',
      permissions: [],
      role: 'nurse',
      roleCodes: ['nurse'],
      username: 'nurse.vitals.demo',
    });
  });
});
