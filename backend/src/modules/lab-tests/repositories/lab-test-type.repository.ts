import { prisma } from '../../../core/db/prisma-client';

export function listActiveLabTestTypes(keyword?: string) {
  return prisma.labTestType.findMany({
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
