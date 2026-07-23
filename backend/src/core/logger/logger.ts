import pino from 'pino';

import { config } from '../../config/unifiedConfig';

export const logger = pino({
  level: config.app.env === 'production' ? 'info' : 'debug',
  transport:
    config.app.env === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
});
