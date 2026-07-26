import type { Request, Response } from 'express';
import { describe, expect, it } from 'vitest';

import { IdentityController } from '../../src/modules/identity/IdentityController';
import type { IdentityService } from '../../src/modules/identity/identityService';
import type { AuthenticatedRequest, Principal } from '../../src/modules/identity/identityTypes';

const now = new Date('2026-07-24T08:00:00.000Z');

const principal: Principal = {
  authVersion: 1,
  departmentId: 'it',
  fullName: 'IT Dev',
  id: '11111111-1111-4111-8111-111111111111',
  isActive: true,
  mustChangePassword: false,
  permissions: [],
  roleCodes: ['it_tech'],
  userId: '11111111-1111-4111-8111-111111111111',
  username: 'it.tech.dev',
};

const publicStaffUser = {
  ...principal,
  createdAt: now,
  dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
  gender: 'male',
  id: '33333333-3333-4333-8333-333333333333',
  identityCardNumber: '001199000001',
  lastLoginAt: null,
  phoneNumber: '0901234567',
  roleCodes: ['doctor'],
  updatedAt: now,
  userId: '33333333-3333-4333-8333-333333333333',
  username: 'doctor.managed',
};

const validCreateStaffBody = {
  dateOfBirth: '1992-02-02',
  departmentId: 'it',
  fullName: 'Managed Staff',
  gender: 'female',
  identityCardNumber: '001199200003',
  phoneNumber: '0901234569',
  roleCodes: ['doctor'],
  username: 'doctor.managed',
};

type MockResponseState = {
  body?: unknown;
  headers: Map<string, string>;
  statusCode: number;
};

const createMockResponse = (requestId = 'req-controller') => {
  const state: MockResponseState = {
    headers: new Map(),
    statusCode: 200,
  };
  const response = {
    json: (body: unknown) => {
      state.body = body;
      return response;
    },
    locals: {
      requestId,
    },
    setHeader: (name: string, value: number | string | readonly string[]) => {
      state.headers.set(name.toLowerCase(), Array.isArray(value) ? value.join(',') : String(value));
      return response;
    },
    status: (statusCode: number) => {
      state.statusCode = statusCode;
      return response;
    },
  };

  return {
    response: response as unknown as Response,
    state,
  };
};

const getValidationFields = (body: unknown) => {
  if (!body || typeof body !== 'object' || !('error' in body)) {
    return {};
  }

  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== 'object' || !('fields' in error)) {
    return {};
  }

  const fields = (error as { fields?: unknown }).fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  return fields as Record<string, unknown>;
};

const createAuthenticatedRequest = ({
  body = {},
  headers = {},
  params = {},
  query = {},
}: {
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
} = {}) => {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );

  return {
    body,
    header: (name: string) => normalizedHeaders.get(name.toLowerCase()),
    params,
    principal,
    query,
  } as unknown as AuthenticatedRequest;
};

describe('IdentityController staff endpoints', () => {
  it('creates staff accounts with no-store response and a one-time password envelope', async () => {
    const serviceCalls: unknown[] = [];
    const controller = new IdentityController({
      createStaffAccount: (input: unknown) => {
        serviceCalls.push(input);
        return Promise.resolve({
          temporaryPassword: 'Tmp#OneTime2026',
          user: publicStaffUser,
        });
      },
    } as unknown as IdentityService);
    const { response, state } = createMockResponse('req-create-controller');

    await controller.createStaffAccount(
      createAuthenticatedRequest({ body: validCreateStaffBody }),
      response,
    );

    expect(state.statusCode).toBe(201);
    expect(state.headers.get('cache-control')).toBe('no-store');
    expect(state.body).toMatchObject({
      data: {
        temporaryPassword: 'Tmp#OneTime2026',
        user: {
          id: publicStaffUser.id,
          username: publicStaffUser.username,
        },
      },
      meta: {
        requestId: 'req-create-controller',
      },
    });
    expect(serviceCalls.at(0)).toMatchObject({
      actor: principal,
      input: validCreateStaffBody,
      requestId: 'req-create-controller',
    });
    expect(serviceCalls.at(0)).not.toHaveProperty('input.supportRequestReference');
  });

  it('returns field errors and does not call service when create validation fails', async () => {
    const controller = new IdentityController({
      createStaffAccount: () => {
        throw new Error('Service must not be called for invalid request bodies');
      },
    } as unknown as IdentityService);
    const { response, state } = createMockResponse('req-invalid-create');

    await controller.createStaffAccount(
      createAuthenticatedRequest({
        body: {
          ...validCreateStaffBody,
          identityCardNumber: '123',
          phoneNumber: '0123456789',
          supportRequestReference: 'REQ-20260725-001',
          username: 'no space',
        },
      }),
      response,
    );

    expect(state.statusCode).toBe(400);
    expect(state.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        requestId: 'req-invalid-create',
      },
    });
    const fields = getValidationFields(state.body);

    expect(Array.isArray(fields.identityCardNumber)).toBe(true);
    expect(Array.isArray(fields.phoneNumber)).toBe(true);
    expect(Array.isArray(fields.username)).toBe(true);
  });

  it('passes If-Unmodified-Since through updateStaffAccount for optimistic locking', async () => {
    const serviceCalls: unknown[] = [];
    const controller = new IdentityController({
      updateStaffAccount: (input: unknown) => {
        serviceCalls.push(input);
        return Promise.resolve(publicStaffUser);
      },
    } as unknown as IdentityService);
    const { response, state } = createMockResponse('req-update-controller');

    await controller.updateStaffAccount(
      createAuthenticatedRequest({
        body: {
          isActive: false,
        },
        headers: {
          'If-Unmodified-Since': now.toISOString(),
        },
        params: {
          userId: publicStaffUser.id,
        },
      }),
      response,
    );

    expect(state.statusCode).toBe(200);
    expect(serviceCalls.at(0)).toMatchObject({
      ifUnmodifiedSince: now.toISOString(),
      input: {
        isActive: false,
      },
      userId: publicStaffUser.id,
    });
  });

  it('resets staff passwords with no-store response and validates reason before service', async () => {
    const serviceCalls: unknown[] = [];
    const controller = new IdentityController({
      resetStaffPassword: (input: unknown) => {
        serviceCalls.push(input);
        return Promise.resolve({
          temporaryPassword: 'Tmp#Reset2026',
          user: publicStaffUser,
        });
      },
    } as unknown as IdentityService);
    const { response, state } = createMockResponse('req-reset-controller');

    await controller.resetStaffPassword(
      createAuthenticatedRequest({
        body: {
          reason: 'Người dùng yêu cầu cấp lại mật khẩu qua IT',
        },
        params: {
          userId: publicStaffUser.id,
        },
      }),
      response,
    );

    expect(state.statusCode).toBe(200);
    expect(state.headers.get('cache-control')).toBe('no-store');
    expect(serviceCalls.at(0)).toMatchObject({
      reason: 'Người dùng yêu cầu cấp lại mật khẩu qua IT',
      userId: publicStaffUser.id,
    });
  });

  it('normalizes public login validation failures with requestId', async () => {
    const controller = new IdentityController({} as IdentityService);
    const { response, state } = createMockResponse('req-login-invalid');

    await controller.createSession(
      {
        body: {
          password: '',
          username: 'no space',
        },
      } as Request,
      response,
    );

    expect(state.statusCode).toBe(400);
    expect(state.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        requestId: 'req-login-invalid',
      },
    });
    const fields = getValidationFields(state.body);

    expect(Array.isArray(fields.password)).toBe(true);
    expect(Array.isArray(fields.username)).toBe(true);
  });
});
