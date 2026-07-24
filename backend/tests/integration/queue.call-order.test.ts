import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/core/prisma/prisma';
import { queueService } from '../../src/modules/queue/services/queue.service';

describe('queue call-next order (FIFO by number)', () => {
  it('gọi đúng thứ tự number tăng dần trong ngày', async () => {
    const issued = [];
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      issued.push(await queueService.issueTicket({ idempotencyKey: randomUUID() }));
    }

    const numbers = issued.map((ticket) => ticket.number).sort((a, b) => a - b);
    expect(numbers[1]).toBe((numbers[0] ?? 0) + 1);
    expect(numbers[2]).toBe((numbers[0] ?? 0) + 2);

    const first = await queueService.callNext(undefined);
    const second = await queueService.callNext(undefined);
    const third = await queueService.callNext(undefined);

    // Ba lần call-next phải theo thứ tự số vừa issue (có thể có waiting cũ phía trước).
    // Chỉ assert monotonic tăng trong chuỗi call của test này.
    expect(first.status).toBe('called');
    expect(second.status).toBe('called');
    expect(third.status).toBe('called');
    expect(second.number).toBeGreaterThan(first.number);
    expect(third.number).toBeGreaterThan(second.number);
  });

  it('markTicketServed chỉ chấp nhận ticket called', async () => {
    const waiting = await queueService.issueTicket({ idempotencyKey: randomUUID() });

    await expect(queueService.markTicketServed(waiting.ticketId)).rejects.toMatchObject({
      code: 'QUEUE_TICKET_NOT_CALLED',
    });

    const called = await queueService.callNext(undefined);
    // Gọi serve trên số vừa call (có thể không phải waiting ticket vừa issue nếu còn hàng cũ).
    const served = await queueService.markTicketServed(called.ticketId);
    expect(served.status).toBe('served');
    expect(served.servedAt).toBeTruthy();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
