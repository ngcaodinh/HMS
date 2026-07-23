import * as Sentry from '@sentry/node';

import { config } from './config/unifiedConfig';

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.app.env,
    tracesSampleRate: config.app.env === 'production' ? 0.1 : 1,
  });
}
