/**
 * Backfill paid_at / created_at / updated_at wall-clock VN cho invoice thiếu dữ liệu.
 * npx tsx scripts/backfill-invoice-paid-at.ts
 */
import { PrismaClient } from '@prisma/client';

import { toVietnamDbDateTime } from '../src/core/time/vietnamClock';

const prisma = new PrismaClient();

async function main() {
  const nowVn = toVietnamDbDateTime();

  const paidMissing = await prisma.invoice.findMany({
    where: { status: 'paid', paidAt: null },
    select: { id: true, updatedAt: true, createdAt: true },
  });

  for (const row of paidMissing) {
    const paidAt = row.updatedAt ?? row.createdAt ?? nowVn;
    await prisma.invoice.update({
      where: { id: row.id },
      data: { paidAt, updatedAt: toVietnamDbDateTime(paidAt) },
    });
    console.log('backfill paidAt', row.id);
  }

  console.log(`Done. Backfilled ${paidMissing.length} invoices missing paid_at.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
