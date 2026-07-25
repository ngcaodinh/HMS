import './instrument';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { config } from './config/unifiedConfig';
import { checkPrismaReadiness } from './core/database/prismaClient';
import { logger } from './core/logger/logger';
import { AppError, isAppError, mapErrorDetailsToFields } from './core/http/AppError';
import { asyncHandler } from './core/http/asyncHandler';
import { requestContext } from './core/http/requestContext';
import { identityRoutes } from './modules/identity/identityRoutes';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));
  app.use(requestContext);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'hms-backend',
      timezone: config.app.timezone,
    });
  });

  app.get('/ready', asyncHandler(async (_req, res) => {
    try {
      await checkPrismaReadiness();
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_NOT_READY',
          message: 'Database is not ready',
        },
      });
    }
  }));

  app.use('/api/v1', identityRoutes);

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      void _next;
      const appError = isAppError(error)
        ? error
        : new AppError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Hệ thống tạm thời không xử lý được yêu cầu',
            status: 500,
          });

      const requestId = res.locals.requestId as string | undefined;

      res.status(appError.status).json({
        error: {
          code: appError.code,
          details: appError.details,
          fields: mapErrorDetailsToFields(appError.details),
          message: appError.message,
          requestId,
        },
      });
    },
  );

  return app;
};
