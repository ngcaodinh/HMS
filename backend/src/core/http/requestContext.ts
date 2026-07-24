import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  res.locals.requestId = req.header('x-request-id') ?? randomUUID();
  res.setHeader('X-Request-Id', res.locals.requestId);
  next();
};
