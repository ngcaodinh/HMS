import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from '../errors/app-error';

interface RequestSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates `req.body/query/params` against Zod schemas at the route boundary
 * (CLAUDE.md §6.3) and rejects with 400 `VALIDATION_ERROR` before the controller runs.
 */
export function validateRequest(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      const zodError = error as { issues?: { path: (string | number)[]; message: string }[] };
      const details = zodError.issues?.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        rule: issue.message,
      }));
      next(AppError.badRequest('VALIDATION_ERROR', 'Dữ liệu đầu vào không hợp lệ.', details));
    }
  };
}
