import { createServer } from 'node:http';

import { Server } from 'socket.io';

import { createApp } from './app';
import { config } from './config/unifiedConfig';
import { connectPrisma, disconnectPrisma } from './core/database/prismaClient';
import { logger } from './core/logger/logger';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.debug({ socketId: socket.id }, 'Socket connected');
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down HMS backend');
  await disconnectPrisma();
  httpServer.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void connectPrisma().then(() => {
  httpServer.listen(config.app.port, config.app.host, () => {
    logger.info(
      {
        host: config.app.host,
        port: config.app.port,
        timezone: config.app.timezone,
      },
      'HMS backend is running',
    );
  });
});
