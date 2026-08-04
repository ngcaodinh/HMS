import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/core/prisma/prisma';
import { patientService } from '../../src/modules/patients/services/patient.service';
import { receptionRepository } from '../../src/modules/reception/repositories/reception.repository';
import { receptionService } from '../../src/modules/reception/services/reception.service';
import { ensureReceptionIntegrationFixtures } from './reception.fixtures';

beforeAll(async () => {
  await ensureReceptionIntegrationFixtures();
});

describe('createEmergencyAdmission', () => {
  it('tạo BN vô danh + record emergency, không tạo queue ticket', async () => {
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

    const linkedTicketCount = await prisma.queueTicket.count({
      where: { recordId: result.medicalRecord.recordId },
    });
    expect(linkedTicketCount).toBe(0);

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

  it('chấp nhận reason đúng 10 ký tự', async () => {
    const result = await receptionService.createEmergencyAdmission({
      gender: 'male',
      emergencyReason: '1234567890',
    });

    expect(result.medicalRecord.emergencyReason).toBe('1234567890');
  });

  it('chấp nhận reason đúng giới hạn tối đa 500 ký tự', async () => {
    const result = await receptionService.createEmergencyAdmission({
      gender: 'female',
      emergencyReason: 'a'.repeat(500),
    });

    expect(result.medicalRecord.emergencyReason).toBe('a'.repeat(500));
  });

  it('từ chối bác sĩ cấp cứu không tồn tại', async () => {
    await expect(
      receptionService.createEmergencyAdmission({
        gender: 'male',
        emergencyReason: 'Tai nạn giao thông nghiêm trọng.',
        doctorId: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toMatchObject({
      code: 'DOCTOR_NOT_FOUND',
      message: 'Không tìm thấy bác sĩ',
    });
  });

  it('từ chối cấp cứu khi không có bác sĩ đang trực', async () => {
    const listDoctorsSpy = vi
      .spyOn(receptionRepository, 'listActiveDoctors')
      .mockResolvedValueOnce([]);

    try {
      await expect(
        receptionService.createEmergencyAdmission({
          gender: 'female',
          emergencyReason: 'Bệnh nhân cần cấp cứu ngay lập tức.',
        }),
      ).rejects.toMatchObject({
        code: 'NO_ON_DUTY_DOCTOR',
        message: 'Không có bác sĩ sẵn sàng cho ca cấp cứu',
      });
    } finally {
      listDoctorsSpy.mockRestore();
    }
  });

  it('từ chối cấp cứu khi không resolve được dịch vụ khám', async () => {
    const serviceSpy = vi
      .spyOn(receptionRepository, 'findConsultationService')
      .mockResolvedValueOnce(null);

    try {
      await expect(
        receptionService.createEmergencyAdmission({
          gender: 'male',
          emergencyReason: 'Bệnh nhân cần cấp cứu ngay lập tức.',
        }),
      ).rejects.toMatchObject({
        code: 'CONSULTATION_SERVICE_UNRESOLVED',
        message: 'Không tìm thấy dịch vụ khám',
      });
    } finally {
      serviceSpy.mockRestore();
    }
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

  it.each([
    ['invalid phone', { phoneNumber: '0123' }, 'INVALID_PHONE_FORMAT'],
    ['missing phone reason', { phoneNumber: null }, 'PHONE_REQUIRED'],
    ['invalid identity card', { identityCardNumber: '123' }, 'INVALID_IDENTITY_CARD_FORMAT'],
  ] as const)('bảo vệ input khi chuẩn hóa danh tính: %s', async (_name, overrides, code) => {
    const created = await receptionService.createEmergencyAdmission({
      gender: 'male',
      emergencyReason: 'Tai nạn giao thông, bệnh nhân bất tỉnh tại hiện trường.',
    });
    const patient = await prisma.patient.findUniqueOrThrow({
      where: { id: created.patient.patientId },
    });

    await expect(
      patientService.normalizeEmergencyIdentity(patient.id, {
        expectedVersion: patient.version,
        fullName: 'Le Van Cap Cuu',
        dateOfBirth: '1985-03-20',
        gender: 'male',
        phoneNumber: '0911222333',
        privacyNoticeAccepted: true,
        ...overrides,
      }),
    ).rejects.toMatchObject({ code });
  });

  it('trả RECORD_ALREADY_CLOSED khi chuẩn hóa sau lúc bệnh án đã đóng', async () => {
    const created = await receptionService.createEmergencyAdmission({
      gender: 'male',
      emergencyReason: 'Tai nạn giao thông, bệnh nhân bất tỉnh tại hiện trường.',
    });

    await prisma.medicalRecord.update({
      where: { id: created.medicalRecord.recordId },
      data: { status: 'closed' },
    });

    const patient = await prisma.patient.findUniqueOrThrow({
      where: { id: created.patient.patientId },
    });

    await expect(
      patientService.normalizeEmergencyIdentity(patient.id, {
        expectedVersion: patient.version,
        fullName: 'Le Van Cap Cuu',
        dateOfBirth: '1985-03-20',
        gender: 'male',
        phoneNumber: '0911222333',
        privacyNoticeAccepted: true,
      }),
    ).rejects.toMatchObject({
      code: 'RECORD_ALREADY_CLOSED',
      message: 'Không có bệnh án cấp cứu đang mở để chuẩn hóa danh tính',
    });
  });

  it('trả VERSION_CONFLICT khi chuẩn hóa dùng version cũ', async () => {
    const created = await receptionService.createEmergencyAdmission({
      gender: 'female',
      emergencyReason: 'Bệnh nhân cần cấp cứu ngay lập tức.',
    });

    await expect(
      patientService.normalizeEmergencyIdentity(created.patient.patientId, {
        expectedVersion: 999,
        fullName: 'Le Van Cap Cuu',
        dateOfBirth: '1985-03-20',
        gender: 'female',
        phoneNumber: '0911222333',
        privacyNoticeAccepted: true,
      }),
    ).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
      message: 'Hồ sơ đã được cập nhật bởi người khác. Vui lòng tải lại.',
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
