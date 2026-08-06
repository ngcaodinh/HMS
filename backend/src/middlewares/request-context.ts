import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Gắn requestId cho tracing / error envelope.
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = req.header('x-request-id') ?? randomUUID();
  res.locals.requestId = req.requestId;
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
