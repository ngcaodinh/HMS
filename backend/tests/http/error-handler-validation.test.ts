import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

const mocks = vi.hoisted(() => ({
  sendError: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('../../src/core/http/response', () => ({ sendError: mocks.sendError }));
vi.mock('../../src/core/logger/logger', () => ({ logger: { error: mocks.loggerError } }));

import { errorHandler } from '../../src/middlewares/errorHandler';

describe('validation error response contract', () => {
  it('exposes Vietnamese field rules under both rule and legacy message keys', () => {
    const error = new ZodError([
      {
        code: 'custom',
        path: ['bloodPressureSystolic'],
        message: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
      },
      {
        code: 'custom',
        path: ['spo2'],
        message: 'SpO2 không được lớn hơn 100%.',
      },
    ]);

    errorHandler(error, { requestId: 'request-1' } as never, {} as never, vi.fn());

    expect(mocks.sendError).toHaveBeenCalledWith(
      expect.anything(),
      400,
      'VALIDATION_ERROR',
      'Dữ liệu đầu vào không hợp lệ',
      [
        {
          field: 'bloodPressureSystolic',
          rule: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
          message: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
        },
        {
          field: 'spo2',
          rule: 'SpO2 không được lớn hơn 100%.',
          message: 'SpO2 không được lớn hơn 100%.',
        },
      ],
      'request-1',
    );
  });

  it('uses the exact field rule as the top-level message for one invalid field', () => {
    const error = new ZodError([
      {
        code: 'custom',
        path: ['pulse'],
        message: 'Mạch phải lớn hơn 0.',
      },
    ]);

    errorHandler(error, { requestId: 'request-2' } as never, {} as never, vi.fn());

    expect(mocks.sendError).toHaveBeenCalledWith(
      expect.anything(),
      400,
      'VALIDATION_ERROR',
      'Mạch phải lớn hơn 0.',
      [
        {
          field: 'pulse',
          rule: 'Mạch phải lớn hơn 0.',
          message: 'Mạch phải lớn hơn 0.',
        },
      ],
      'request-2',
    );
  });
});
