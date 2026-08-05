import { describe, expect, it, vi } from 'vitest';

import type { Principal } from '../../src/modules/auth/types/auth.types';

const repositoryMocks = vi.hoisted(() => ({
  findMedicalRecordById: vi.fn(),
  findWorklist: vi.fn(),
}));

vi.mock(
  '../../src/modules/medical-records/repositories/medical-record.repository',
  () => repositoryMocks,
);

import { getMedicalRecordDetail } from '../../src/modules/medical-records/services/medical-record-query.service';

describe('medical record detail contract', () => {
  it('preserves a null treatment type instead of implying outpatient care', async () => {
    repositoryMocks.findMedicalRecordById.mockResolvedValue({
      id: 'record-1',
      recordCode: 'BA-001',
      status: 'open',
      version: 1,
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      doctor: { fullName: 'Bác sĩ Điều trị' },
      department: { name: 'Khoa Da liễu' },
      bed: { number: 'G-01' },
      diagnosisSignedByUser: { fullName: 'Bác sĩ Ký' },
      isEmergency: false,
      chiefComplaint: null,
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
      heightCm: null,
      weightKg: null,
      historyOfPresentIllness: null,
      pastMedicalHistory: null,
      familyHistory: null,
      skinLesionTypes: null,
      skinLesionDescription: null,
      skinLesionLocation: null,
      skinLesionDistribution: null,
      bodySurfaceAreaPercent: null,
      itchSeverity: null,
      vitalSigns: null,
      icd10: 'J45.0',
      icdCodingSystem: 'TT06_2026',
      diagnosisText: 'Hen phế quản',
      treatmentType: null,
      diagnosedAt: null,
      diagnosisSignedAt: null,
      patient: {
        id: 'patient-1',
        patientCode: 'BN-001',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        gender: 'male',
        allergies: null,
        healthInsuranceCode: null,
        healthInsuranceExpiryDate: null,
        address: null,
        emergencyContact: null,
        emergencyPhoneNumber: null,
      },
      labTests: [],
    });

    const result = await getMedicalRecordDetail('record-1', {
      id: 'doctor-1',
      userId: 'doctor-1',
      username: 'doctor',
      fullName: 'Doctor',
      roleCodes: ['doctor'],
      permissions: [],
      departmentId: 'department-1',
      isActive: true,
      mustChangePassword: false,
      authVersion: 1,
    } satisfies Principal);

    expect(result.record.diagnosis?.treatmentType).toBeNull();
    expect(result.record.recordCode).toBe('BA-001');
    expect(result.record.department).toEqual({ name: 'Khoa Da liễu' });
    expect(result.record.bed).toEqual({ number: 'G-01' });
    expect(result.record.diagnosisSigner).toEqual({ fullName: 'Bác sĩ Ký' });
  });
});
