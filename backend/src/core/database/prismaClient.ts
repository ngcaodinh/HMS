import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton dùng chung trong process để tránh tạo nhiều connection pool.
 */
export const prisma = new PrismaClient();

/**
 * Mở kết nối Prisma trước khi server bắt đầu nhận request.
 */
export const connectPrisma = () => prisma.$connect();

/**
 * Đóng kết nối Prisma khi process nhận tín hiệu shutdown.
 */
export const disconnectPrisma = () => prisma.$disconnect();

/**
 * Readiness check tối thiểu để xác nhận API còn kết nối được MySQL.
 */
export const checkPrismaReadiness = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
