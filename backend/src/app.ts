import './instrument';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { config } from './config/unifiedConfig';
import { logger } from './core/logger/logger';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'hms-backend',
      timezone: config.app.timezone,
    });
  });

  return app;
};
