import type { NextFunction, Request, Response } from 'express';

/**
 * Bọc handler async để Express nhận lỗi qua next thay vì unhandled rejection.
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
