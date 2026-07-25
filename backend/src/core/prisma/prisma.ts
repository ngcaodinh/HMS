import { PrismaClient } from '@prisma/client';

import { logger } from '../logger/logger';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Singleton PrismaClient cho toàn bộ backend.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

prisma
  .$connect()
  .then(() => {
    logger.debug('Prisma connected');
  })
  .catch((error: unknown) => {
    logger.error({ error }, 'Prisma connection failed');
  });
