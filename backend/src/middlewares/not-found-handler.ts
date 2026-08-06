import { randomUUID } from 'node:crypto';

import type { Request, Response } from 'express';

// Compatibility path: errorHandler canonical nằm trong file camelCase cùng thư mục.
export { errorHandler } from './error-handler';

/** Trả lỗi chuẩn cho route `/api/v1/*` không tồn tại. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Không tìm thấy route ${req.method} ${req.path}.`,
      requestId: randomUUID(),
    },
  });
}
