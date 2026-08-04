import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  sendError: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('../src/core/http/response', () => ({ sendError: mocks.sendError }));
vi.mock('../src/core/logger/logger', () => ({ logger: { error: mocks.loggerError } }));

import { AppError as CanonicalAppError } from '../src/core/errors/appError';
import { AppError as LegacyHttpAppError } from '../src/core/http/AppError';
import { AppError as LegacyUtilsAppError } from '../src/core/utils/AppError';
import { errorHandler } from '../src/middlewares/errorHandler';

describe('nurse error response contract', () => {
  it('uses one AppError class for all compatibility import paths', () => {
    expect(LegacyHttpAppError).toBe(CanonicalAppError);
    expect(LegacyUtilsAppError).toBe(CanonicalAppError);

    const error = new LegacyUtilsAppError(409, 'VERSION_CONFLICT', 'Hồ sơ đã thay đổi');
    expect(error).toBeInstanceOf(CanonicalAppError);
    expect(error.statusCode).toBe(409);
    expect(error.httpStatus).toBe(409);
    expect(error.status).toBe(409);
  });

  it.each([
    ['VERSION_CONFLICT', 409, 'Hồ sơ đã bị thay đổi bởi thao tác khác'],
    ['BED_UNAVAILABLE', 400, 'Giường đã có người hoặc đang bảo trì'],
    ['TICKET_NOT_CALLED', 409, 'Số thứ tự không ở trạng thái đang gọi, không thể lưu kết quả'],
    ['VITALS_ALREADY_RECORDED', 409, 'Hồ sơ này đã được đo sinh hiệu'],
    ['SPECIMEN_ALREADY_COLLECTED', 400, 'Mẫu bệnh phẩm đã được lấy hoặc đã bàn giao'],
  ])('returns the business error %s instead of a generic 500', (code, status, message) => {
    const error = new CanonicalAppError(status, code, message);

    errorHandler(error, { requestId: 'request-nurse-1' } as never, {} as never, vi.fn());

    expect(mocks.sendError).toHaveBeenCalledWith(
      expect.anything(),
      status,
      code,
      message,
      undefined,
      'request-nurse-1',
    );
  });

  it('maps Prisma unique constraint errors to a safe conflict response', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.20.0',
      meta: { target: ['identityCardNumber'] },
    });

    errorHandler(error, { requestId: 'request-nurse-2' } as never, {} as never, vi.fn());

    expect(mocks.sendError).toHaveBeenCalledWith(
      expect.anything(),
      409,
      'CONFLICT_ERROR',
      'Số CCCD đã tồn tại trên hệ thống',
      [
        {
          field: 'identityCardNumber',
          rule: 'unique',
          message: 'Số CCCD đã tồn tại trên hệ thống',
        },
      ],
      'request-nurse-2',
    );
  });
});
