import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Gắn requestId cho tracing / error envelope.
 */
export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = (req.header('x-request-id') as string | undefined) ?? randomUUID();
  next();
}
