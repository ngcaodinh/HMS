import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

/**
 * Gắn requestId cho mỗi request để trace lỗi và audit xuyên backend/frontend.
 */
export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') ?? randomUUID();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
