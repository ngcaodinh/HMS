import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/core/prisma/prisma';
import { queueService } from '../../src/modules/queue/services/queue.service';
import { receptionRepository } from '../../src/modules/reception/repositories/reception.repository';
import { receptionService } from '../../src/modules/reception/services/reception.service';
import {
  ensureReceptionIntegrationFixtures,
  RECEPTION_TEST_DOCTOR_ID,
} from './reception.fixtures';

const app = createApp();

const validHttpBody = {
  queueTicketId: '11111111-1111-4111-8111-111111111111',
  doctorId: RECEPTION_TEST_DOCTOR_ID,
  newPatient: {
    fullName: 'Nguyen HTTP Validation',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    phoneNumber: '0912345678',
    privacyNoticeAccepted: true,
  },
};

type ValidationErrorResponse = {
  error: {
    details: Array<{ field: string; message: string }>;
    message: string;
  };
};

const getValidationError = (response: { body: unknown }): ValidationErrorResponse =>
  response.body as ValidationErrorResponse;

let identitySequence = 0;

const nextIdentityCard = (): string => {
  identitySequence += 1;
  return `8${String(Date.now()).slice(-9)}${String(identitySequence).padStart(2, '0')}`;
};

const issueCalledTicket = async () => {
  const issued = await queueService.issueTicket({ idempotencyKey: randomUUID() });
  await prisma.queueTicket.update({
    where: { id: issued.ticketId },
    data: { status: 'called', calledAt: new Date() },
  });

  return issued.ticketId;
};

beforeAll(async () => {
  await ensureReceptionIntegrationFixtures();
});

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
      doctorId: RECEPTION_TEST_DOCTOR_ID,
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
        doctorId: RECEPTION_TEST_DOCTOR_ID,
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

  it('từ chối input nội bộ thiếu queue trước khi tạo bệnh nhân', async () => {
    await expect(
      receptionService.createReception({
        doctorId: RECEPTION_TEST_DOCTOR_ID,
        newPatient: {
          fullName: 'Missing Queue Patient',
          dateOfBirth: '1988-05-01',
          gender: 'female',
          phoneNumber: '0987654321',
          privacyNoticeAccepted: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'QUEUE_TICKET_REQUIRED',
      message: 'Thiếu số thứ tự hàng đợi',
    });
  });

  it.each([
    ['invalid phone', { phoneNumber: '0123' }, 'INVALID_PHONE_FORMAT'],
    ['missing phone reason', { phoneNumber: null }, 'PHONE_REQUIRED'],
    ['invalid identity card', { identityCardNumber: '123' }, 'INVALID_IDENTITY_CARD_FORMAT'],
    ['missing privacy consent', { privacyNoticeAccepted: false as true }, 'VALIDATION_ERROR'],
  ] as const)('keeps service defense-in-depth for %s', async (_name, overrides, code) => {
    await expect(
      receptionService.createReception({
        queueTicketId: await issueCalledTicket(),
        doctorId: RECEPTION_TEST_DOCTOR_ID,
        newPatient: {
          fullName: 'Service Validation Patient',
          dateOfBirth: '1988-05-01',
          gender: 'female',
          phoneNumber: '0987654321',
          privacyNoticeAccepted: true,
          ...overrides,
        },
      }),
    ).rejects.toMatchObject({ code });
  });

  it('rejects an unknown queue ticket without serving any ticket', async () => {
    const queueTicketId = randomUUID();

    await expect(
      receptionService.createReception({
        queueTicketId,
        doctorId: RECEPTION_TEST_DOCTOR_ID,
        newPatient: {
          fullName: 'Unknown Queue Patient',
          dateOfBirth: '1988-05-01',
          gender: 'male',
          phoneNumber: '0987654321',
          privacyNoticeAccepted: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'QUEUE_TICKET_NOT_FOUND',
      message: 'Không tìm thấy số thứ tự',
    });
  });

  it('rejects a duplicate CCCD with a conflict and keeps the original flow authoritative', async () => {
    const identityCardNumber = nextIdentityCard();
    const firstResult = await receptionService.createReception({
      queueTicketId: await issueCalledTicket(),
      doctorId: RECEPTION_TEST_DOCTOR_ID,
      newPatient: {
        fullName: 'Original Identity Patient',
        dateOfBirth: '1988-05-01',
        gender: 'male',
        phoneNumber: '0987654321',
        identityCardNumber,
        privacyNoticeAccepted: true,
      },
    });

    expect(firstResult.patient.patientCode).toMatch(/^BN/);

    await expect(
      receptionService.createReception({
        queueTicketId: await issueCalledTicket(),
        doctorId: RECEPTION_TEST_DOCTOR_ID,
        newPatient: {
          fullName: 'Duplicate Identity Patient',
          dateOfBirth: '1988-05-01',
          gender: 'female',
          phoneNumber: '0912345678',
          identityCardNumber,
          privacyNoticeAccepted: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'IDENTITY_CARD_ALREADY_EXISTS',
      message: 'CCCD đã tồn tại. Vui lòng mở hồ sơ bệnh nhân hiện có.',
    });
  });

  it('rejects an invalid doctor before creating a patient', async () => {
    await expect(
      receptionService.createReception({
        queueTicketId: await issueCalledTicket(),
        doctorId: randomUUID(),
        newPatient: {
          fullName: 'Invalid Doctor Patient',
          dateOfBirth: '1988-05-01',
          gender: 'male',
          phoneNumber: '0912345678',
          privacyNoticeAccepted: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'MISSING_DOCTOR',
      message: 'Bác sĩ không hợp lệ hoặc không hoạt động',
    });
  });

  it('maps a queue race to QUEUE_TICKET_ALREADY_CHANGED', async () => {
    const created = await receptionService.createReception({
      queueTicketId: await issueCalledTicket(),
      doctorId: RECEPTION_TEST_DOCTOR_ID,
      newPatient: {
        fullName: 'Queue Race Patient',
        dateOfBirth: '1988-05-01',
        gender: 'male',
        phoneNumber: '0912345678',
        privacyNoticeAccepted: true,
      },
    });
    const completeReceptionSpy = vi
      .spyOn(receptionRepository, 'completeReception')
      .mockRejectedValueOnce(new Error('QUEUE_TICKET_ALREADY_CHANGED'));

    try {
      await expect(
        receptionService.createReception({
          queueTicketId: await issueCalledTicket(),
          doctorId: RECEPTION_TEST_DOCTOR_ID,
          existingPatientId: created.patient.patientId,
        }),
      ).rejects.toMatchObject({
        code: 'QUEUE_TICKET_ALREADY_CHANGED',
        message: 'Số thứ tự đã thay đổi trạng thái. Vui lòng làm mới.',
      });
    } finally {
      completeReceptionSpy.mockRestore();
    }
  });
});

describe('POST /api/v1/receptions validation contract', () => {
  it.each([
    [
      'invalid phone',
      { newPatient: { ...validHttpBody.newPatient, phoneNumber: '0123' } },
      400,
      'Số điện thoại phải gồm 10 chữ số đầu di động Việt Nam hợp lệ',
      'newPatient.phoneNumber',
    ],
    [
      'future date of birth',
      { newPatient: { ...validHttpBody.newPatient, dateOfBirth: '2999-01-01' } },
      400,
      'Ngày sinh không được ở tương lai',
      'newPatient.dateOfBirth',
    ],
    [
      'missing privacy consent',
      { newPatient: { ...validHttpBody.newPatient, privacyNoticeAccepted: false } },
      400,
      'Invalid literal value, expected true',
      'newPatient.privacyNoticeAccepted',
    ],
  ] as const)('returns a field-specific 400 for %s', async (_name, overrides, status, message, field) => {
    const response = await request(app)
      .post('/api/v1/receptions')
      .send({ ...validHttpBody, ...overrides });
    const errorResponse = getValidationError(response);

    expect(response.status).toBe(status);
    expect(errorResponse.error.message).toBe(message);
    expect(errorResponse.error.details).toEqual([
      expect.objectContaining({ field, message }),
    ]);
  });

  it('returns a generic top-level message with every field detail when multiple fields fail', async () => {
    const response = await request(app)
      .post('/api/v1/receptions')
      .send({
        ...validHttpBody,
        newPatient: {
          ...validHttpBody.newPatient,
          phoneNumber: null,
          phoneNumberUnavailableReason: null,
          identityCardNumber: '123',
        },
      });
    const errorResponse = getValidationError(response);

    expect(response.status).toBe(400);
    expect(errorResponse.error.message).toBe('Dữ liệu đầu vào không hợp lệ');
    expect(errorResponse.error.details).toEqual([
      expect.objectContaining({
        field: 'newPatient.phoneNumber',
        message: 'Bắt buộc nhập số điện thoại hoặc lý do không có SĐT',
      }),
      expect.objectContaining({
        field: 'newPatient.identityCardNumber',
        message: 'Căn cước công dân phải đủ 12 chữ số',
      }),
    ]);
  });

  it.each([
    ['nine-character emergency reason', { gender: 'male', emergencyReason: '123456789' }, 'Lý do cấp cứu tối thiểu 10 ký tự'],
    ['invalid emergency gender', { gender: 'other', emergencyReason: 'Tai nạn giao thông.' }, /Invalid enum value/],
  ] as const)('returns a clear 400 for %s', async (_name, body, message) => {
    const response = await request(app)
      .post('/api/v1/receptions/emergency')
      .send(body);
    const errorResponse = getValidationError(response);

    expect(response.status).toBe(400);
    if (message instanceof RegExp) {
      expect(errorResponse.error.message).toMatch(message);
      return;
    }

    expect(errorResponse.error.message).toBe(message);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
