// Compatibility path; mọi consumer mới dùng singleton tại `core/prisma/prisma`.
export { checkPrismaReadiness, connectPrisma, disconnectPrisma, prisma } from '../prisma/prisma';
