import pino from 'pino';

import { config } from '../../config/unified-config';

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
