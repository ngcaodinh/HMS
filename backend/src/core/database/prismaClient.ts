import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const connectPrisma = () => prisma.$connect();

export const disconnectPrisma = () => prisma.$disconnect();

export const checkPrismaReadiness = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
