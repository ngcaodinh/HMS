import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client shared across all modules/repositories.
 * Avoids exhausting MySQL connections when `tsx watch` hot-reloads modules.
 */
export const prisma = new PrismaClient();
