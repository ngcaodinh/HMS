import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '../../src/core/prisma/prisma';
import { jwtPort } from '../../src/modules/identity/jwtPort';

type CountValue = bigint | number | string | null;

type QueueDiagnosticsRow = {
  activeTicketCount: CountValue;
  calledTicketCount: CountValue;
  demoMaxDate: Date | null;
  demoMinDate: Date | null;
  demoTicketCount: CountValue;
  demoTicketTodayCount: CountValue;
  today: Date;
  waitingTicketCount: CountValue;
};

const emptyQueueDiagnostics: QueueDiagnosticsRow = {
  activeTicketCount: 0,
  calledTicketCount: 0,
  demoMaxDate: null,
  demoMinDate: null,
  demoTicketCount: 0,
  demoTicketTodayCount: 0,
  today: new Date(),
  waitingTicketCount: 0,
};

// Chuyển COUNT/SUM từ MySQL về number để assertion không phụ thuộc driver trả bigint hay string.
const toNumber = (value: CountValue) => Number(value ?? 0);

// Ném lỗi kèm snapshot dữ liệu để biết thiếu worklist, ticket hôm nay hay quyền/khoa của nurse.
const failWithDiagnostics = (message: string, diagnostics: unknown): never => {
  throw new Error(`${message}\n${JSON.stringify(diagnostics, null, 2)}`);
};

describe('nurse vitals seed data', () => {
  it('có đủ dữ liệu để /nurse hiển thị tiếp nhận và đo chỉ số sinh hiệu', async () => {
    const nurse = await prisma.user.findUnique({
      include: {
        permissions: true,
      },
      where: {
        id: 'usr-nurse-01',
      },
    });
    const nurseRecord = nurse ?? failWithDiagnostics('Không tìm thấy tài khoản nurse demo.', {
      expectedUserId: 'usr-nurse-01',
    });

    const roleCodes = nurseRecord.permissions.map((permission) => permission.roleCode);
    const worklist = await prisma.medicalRecord.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        createdAt: true,
        departmentId: true,
        id: true,
        patient: {
          select: {
            fullName: true,
          },
        },
        recordCode: true,
        status: true,
        vitalConfirmedAt: true,
      },
      take: 10,
      where: {
        departmentId: nurseRecord.departmentId,
        status: {
          not: 'closed',
        },
        vitalConfirmedAt: null,
      },
    });

    const demoRecords = await prisma.medicalRecord.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        departmentId: true,
        recordCode: true,
        status: true,
        vitalConfirmedAt: true,
      },
      where: {
        recordCode: {
          startsWith: 'BA260726A01',
        },
      },
    });

    const [queueDiagnostics] = await prisma.$queryRaw<QueueDiagnosticsRow[]>`
      SELECT
        CURDATE() AS today,
        SUM(CASE WHEN date = CURDATE() AND status IN ('waiting', 'called') THEN 1 ELSE 0 END) AS activeTicketCount,
        SUM(CASE WHEN date = CURDATE() AND status = 'waiting' THEN 1 ELSE 0 END) AS waitingTicketCount,
        SUM(CASE WHEN date = CURDATE() AND status = 'called' THEN 1 ELSE 0 END) AS calledTicketCount,
        SUM(CASE WHEN id LIKE 'qt-vitals-a01-%' THEN 1 ELSE 0 END) AS demoTicketCount,
        SUM(CASE WHEN id LIKE 'qt-vitals-a01-%' AND date = CURDATE() THEN 1 ELSE 0 END) AS demoTicketTodayCount,
        MIN(CASE WHEN id LIKE 'qt-vitals-a01-%' THEN date ELSE NULL END) AS demoMinDate,
        MAX(CASE WHEN id LIKE 'qt-vitals-a01-%' THEN date ELSE NULL END) AS demoMaxDate
      FROM queue_tickets
    `;
    const queue = queueDiagnostics ?? emptyQueueDiagnostics;

    const diagnostics = {
      nurse: {
        departmentId: nurseRecord.departmentId,
        isActive: nurseRecord.isActive,
        roleCodes,
        username: nurseRecord.username,
      },
      queue: {
        activeTicketCount: toNumber(queue.activeTicketCount),
        calledTicketCount: toNumber(queue.calledTicketCount),
        demoMaxDate: queue.demoMaxDate,
        demoMinDate: queue.demoMinDate,
        demoTicketCount: toNumber(queue.demoTicketCount),
        demoTicketTodayCount: toNumber(queue.demoTicketTodayCount),
        today: queue.today,
        waitingTicketCount: toNumber(queue.waitingTicketCount),
      },
      sampleWorklist: worklist.map((record) => ({
        createdAt: record.createdAt,
        departmentId: record.departmentId,
        patientName: record.patient.fullName,
        recordCode: record.recordCode,
        status: record.status,
        vitalConfirmedAt: record.vitalConfirmedAt,
      })),
      seededDemoRecords: demoRecords,
      worklistCountForNurseDepartment: worklist.length,
    };

    if (!nurseRecord.isActive || !roleCodes.includes('nurse')) {
      failWithDiagnostics('Nurse demo không active hoặc chưa được gán role nurse.', diagnostics);
    }

    if (demoRecords.length === 0) {
      failWithDiagnostics('Chưa có medical_records demo BA260726A01* trong database.', diagnostics);
    }

    if (worklist.length === 0) {
      failWithDiagnostics('Không có hồ sơ nào chưa đo sinh hiệu trong khoa của nurse.', diagnostics);
    }

    if (toNumber(queue.activeTicketCount) === 0) {
      failWithDiagnostics('Không có ticket waiting/called với date = CURDATE().', diagnostics);
    }

    expect(worklist.length).toBeGreaterThan(0);
    expect(toNumber(queue.activeTicketCount)).toBeGreaterThan(0);
  });

  it('API /api/v1/inpatient/vitals-queue trả worklist cho identity token của nurse', async () => {
    const app = createApp();
    const nurse = await prisma.user.findUnique({
      where: {
        id: 'usr-nurse-01',
      },
    });
    const nurseRecord = nurse ?? failWithDiagnostics('Không tìm thấy tài khoản nurse demo.', {
      expectedUserId: 'usr-nurse-01',
    });
    const accessToken = jwtPort.sign({
      authVersion: nurseRecord.authVersion,
      userId: nurseRecord.id,
    });

    const response = await request(app)
      .get('/api/v1/inpatient/vitals-queue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.worklist.length).toBeGreaterThan(0);
    expect(response.body.data.ticketQueue.waitingCount).toBeGreaterThanOrEqual(0);
  });

  it('API /api/v1/treatment-orders trả y lệnh chăm sóc cho identity token của nurse', async () => {
    const app = createApp();
    const nurse = await prisma.user.findUnique({
      where: {
        id: 'usr-nurse-01',
      },
    });
    const nurseRecord = nurse ?? failWithDiagnostics('Không tìm thấy tài khoản nurse demo.', {
      expectedUserId: 'usr-nurse-01',
    });
    const accessToken = jwtPort.sign({
      authVersion: nurseRecord.authVersion,
      userId: nurseRecord.id,
    });

    const response = await request(app)
      .get('/api/v1/treatment-orders')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.some((order: { status: string }) => order.status === 'active')).toBe(true);
  });

  it('API /api/v1/inpatient/vitals-queue tra worklist khi nurse thuoc khoa Da Lieu moi', async () => {
    const app = createApp();
    const nurse = await prisma.user.findFirst({
      where: {
        departmentId: 'dermatology',
        isActive: true,
        permissions: {
          some: {
            roleCode: 'nurse',
          },
        },
      },
    });
    const nurseRecord = nurse ?? failWithDiagnostics('Khong tim thay nurse thuoc department dermatology.', {
      expectedDepartmentId: 'dermatology',
    });
    const accessToken = jwtPort.sign({
      authVersion: nurseRecord.authVersion,
      userId: nurseRecord.id,
    });

    const response = await request(app)
      .get('/api/v1/inpatient/vitals-queue')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.worklist.length).toBeGreaterThan(0);
  });

  it('API /api/v1/treatment-orders tra y lenh khi nurse thuoc khoa Da Lieu moi', async () => {
    const app = createApp();
    const nurse = await prisma.user.findFirst({
      where: {
        departmentId: 'dermatology',
        isActive: true,
        permissions: {
          some: {
            roleCode: 'nurse',
          },
        },
      },
    });
    const nurseRecord = nurse ?? failWithDiagnostics('Khong tim thay nurse thuoc department dermatology.', {
      expectedDepartmentId: 'dermatology',
    });
    const accessToken = jwtPort.sign({
      authVersion: nurseRecord.authVersion,
      userId: nurseRecord.id,
    });

    const response = await request(app)
      .get('/api/v1/treatment-orders')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
