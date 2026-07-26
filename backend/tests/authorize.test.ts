import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { authorize } from '../src/middlewares/authorize';

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

describe('authorize legacy middleware', () => {
  it('allows vital_signs.record by doctor role when JWT permissions are empty', () => {
    const request = {
      user: {
        id: 'doctor-1',
        permissions: [],
        role: 'doctor',
        roleCodes: ['doctor'],
        username: 'doctor.demo',
      },
    } as unknown as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    authorize('vital_signs.record')(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('denies vital_signs.record for unrelated roles without explicit permission', () => {
    const request = {
      user: {
        id: 'pharmacist-1',
        permissions: [],
        role: 'pharmacist',
        roleCodes: ['pharmacist'],
        username: 'pharmacist.demo',
      },
    } as unknown as Request;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    authorize('vital_signs.record')(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json.mock.calls[0]?.[0].error.code).toBe('FORBIDDEN_ACCESS');
  });
});
