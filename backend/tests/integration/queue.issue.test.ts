import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/core/prisma/prisma';
import { queueService } from '../../src/modules/queue/services/queue.service';

describe('queueService.issueTicket', () => {
  it('cấp số waiting liên tục với Idempotency-Key replay', async () => {
    const key = randomUUID();
    const first = await queueService.issueTicket({ idempotencyKey: key });
    const second = await queueService.issueTicket({ idempotencyKey: key });

    expect(first.ticketId).toBe(second.ticketId);
    expect(first.number).toBe(second.number);
    expect(first.status).toBe('waiting');
    expect(first.receipt.systemName).toBe('HMS-VN');
  });

  it('call-next chuyển ticket waiting nhỏ nhất → called', async () => {
    await queueService.issueTicket({ idempotencyKey: randomUUID() });
    const called = await queueService.callNext(undefined);

    expect(called.status).toBe('called');
    expect(called.number).toBeGreaterThan(0);
    expect(called.calledAt).toBeTruthy();
  });
});


afterAll(async () => {
  await prisma.$disconnect();
});
