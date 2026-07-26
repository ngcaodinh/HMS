import { prisma } from '../../../core/db/prisma-client';

export function listActiveMedicines(keyword?: string) {
  return prisma.medicine.findMany({
    where: {
      isActive: true,
      ...(keyword
        ? { OR: [{ name: { contains: keyword } }, { activeIngredient: { contains: keyword } }] }
        : {}),
    },
    include: {
      medicineBatches: {
        where: { expiryDate: { gt: new Date() }, isActive: true, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
    take: 30,
  });
}
