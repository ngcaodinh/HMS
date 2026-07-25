import './instrument';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { config } from './config/unifiedConfig';
import { checkPrismaReadiness } from './core/database/prismaClient';
import { isAppError, mapErrorDetailsToFields } from './core/http/AppError';
import { asyncHandler } from './core/http/asyncHandler';
import { logger } from './core/logger/logger';
import { errorHandler } from './middlewares/errorHandler';
import { requestContext } from './middlewares/requestContext';
import { identityRoutes } from './modules/identity/identityRoutes';
import { apiV1Router } from './routes';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestContext);
  app.use(pinoHttp({ logger }));

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
  app.use('/api/v1', apiV1Router);

  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (!isAppError(error)) {
        next(error);
        return;
      }

      res.status(error.status).json({
        error: {
          code: error.code,
          details: error.details,
          fields: mapErrorDetailsToFields(error.details),
          message: error.message,
          requestId: req.requestId,
        },
      });
    },
  );
  app.use(errorHandler);

  return app;
};
