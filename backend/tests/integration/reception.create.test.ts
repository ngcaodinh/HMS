import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/core/prisma/prisma';
import { queueService } from '../../src/modules/queue/services/queue.service';
import { receptionService } from '../../src/modules/reception/services/reception.service';

const DOCTOR_ID = '11111111-1111-4111-8111-111111111111';

describe('createReception', () => {
  it('tiếp nhận ticket called → patient + record open + ticket served', async () => {
    const issued = await queueService.issueTicket({ idempotencyKey: randomUUID() });
    // Force call this ticket (may have older waiting ahead — call until match or call issued)
    let active = await queueService.callNext(undefined);
    // Ensure we serve a called ticket (possibly not the one just issued if queue had backlog)
    if (active.ticketId !== issued.ticketId) {
      // Skip ahead or issue+call path: call issued if still waiting
      const entity = await prisma.queueTicket.findUnique({ where: { id: issued.ticketId } });
      if (entity?.status === 'waiting') {
        await prisma.queueTicket.update({
          where: { id: issued.ticketId },
          data: { status: 'called', calledAt: new Date() },
        });
        active = {
          ticketId: issued.ticketId,
          number: issued.number,
          date: issued.date,
          status: 'called',
          calledAt: new Date().toISOString(),
          servedAt: null,
        };
      }
    }

    const suffix = String(Date.now()).slice(-8);
    const result = await receptionService.createReception({
      queueTicketId: active.ticketId,
      doctorId: DOCTOR_ID,
      newPatient: {
        fullName: `Nguyen Test ${suffix}`,
        dateOfBirth: '1990-01-15',
        gender: 'male',
        phoneNumber: '0912345678',
        identityCardNumber: `0${suffix.padStart(11, '0')}`.slice(0, 12),
        address: 'TP.HCM',
        privacyNoticeAccepted: true,
      },
    });

    expect(result.patient.patientCode).toMatch(/^BN/);
    expect(result.medicalRecord.status).toBe('open');
    expect(result.queueTicket.status).toBe('served');
    expect(result.queueTicket.servedAt).toBeTruthy();
    expect(result.serviceOrder.fee).toBe('100000.00');
  });

  it('từ chối tiếp nhận khi ticket chưa called', async () => {
    const waiting = await queueService.issueTicket({ idempotencyKey: randomUUID() });

    await expect(
      receptionService.createReception({
        queueTicketId: waiting.ticketId,
        doctorId: DOCTOR_ID,
        newPatient: {
          fullName: 'Fail Case',
          dateOfBirth: '1988-05-01',
          gender: 'female',
          phoneNumber: '0987654321',
          privacyNoticeAccepted: true,
        },
      }),
    ).rejects.toMatchObject({ code: 'QUEUE_TICKET_NOT_CALLED' });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
