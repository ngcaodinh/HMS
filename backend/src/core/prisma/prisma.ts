import { PrismaClient } from '@prisma/client';

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

/**
 * Mở kết nối cơ sở dữ liệu trước khi server bắt đầu nhận request.
 * Kết nối được gọi tường minh ở bootstrap để import repository không tạo side effect.
 */
export const connectPrisma = (): Promise<void> => prisma.$connect();

/** Đóng connection pool khi process nhận tín hiệu shutdown. */
export const disconnectPrisma = (): Promise<void> => prisma.$disconnect();

/** Kiểm tra nhanh khả năng đọc cơ sở dữ liệu cho endpoint readiness. */
export const checkPrismaReadiness = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};
