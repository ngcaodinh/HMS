import { prisma } from '../../../core/db/prisma-client';

export function listActiveLabTestTypes(keyword?: string) {
  return prisma.lab_test_types.findMany({
    where: {
      isActive: true,
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { code: { contains: keyword } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
  });
}
