import { afterAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/core/prisma/prisma';
import { patientService } from '../../src/modules/patients/services/patient.service';
import { receptionService } from '../../src/modules/reception/services/reception.service';

describe('createEmergencyAdmission', () => {
  it('tạo BN vô danh + record emergency, không tạo queue ticket', async () => {
    const ticketCountBefore = await prisma.queueTicket.count();

    const result = await receptionService.createEmergencyAdmission({
      gender: 'female',
      emergencyReason: 'Bệnh nhân bất tỉnh, chưa xác định được danh tính.',
    });

    expect(result.patient.isEmergencyBypass).toBe(true);
    expect(result.patient.fullName).toMatch(
      /^Vô danh Nữ - Cấp Cứu ngày: \d{4}-\d{2}-\d{2} - \d{3}$/,
    );
    expect(result.medicalRecord.isEmergency).toBe(true);
    expect(result.medicalRecord.emergencyReason?.length).toBeGreaterThanOrEqual(10);
    expect(result.medicalRecord.status).toBe('open');

    const ticketCountAfter = await prisma.queueTicket.count();
    expect(ticketCountAfter).toBe(ticketCountBefore);

    const inDb = await prisma.patient.findUnique({
      where: { id: result.patient.patientId },
    });
    expect(inDb?.isEmergencyBypass).toBe(true);
    expect(inDb?.phoneNumber).toBeNull();
  });

  it('từ chối reason dưới 10 ký tự', async () => {
    await expect(
      receptionService.createEmergencyAdmission({
        gender: 'male',
        emergencyReason: 'quá ngắn',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EMERGENCY_REASON' });
  });

  it('normalize identity tắt bypass', async () => {
    const created = await receptionService.createEmergencyAdmission({
      gender: 'male',
      emergencyReason: 'Tai nạn giao thông, bệnh nhân bất tỉnh tại hiện trường.',
    });

    const patient = await prisma.patient.findUniqueOrThrow({
      where: { id: created.patient.patientId },
    });

    const suffix = String(Date.now()).slice(-8);
    const normalized = await patientService.normalizeEmergencyIdentity(patient.id, {
      expectedVersion: patient.version,
      fullName: 'Le Van Cap Cuu',
      dateOfBirth: '1985-03-20',
      gender: 'male',
      phoneNumber: '0911222333',
      identityCardNumber: `1${suffix.padStart(11, '0')}`.slice(0, 12),
      privacyNoticeAccepted: true,
    });

    expect(normalized.isEmergencyBypass).toBe(false);
    expect(normalized.fullName).toBe('Le Van Cap Cuu');
    expect(normalized.version).toBe(patient.version + 1);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
