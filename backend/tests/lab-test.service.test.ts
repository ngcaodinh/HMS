import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  findAttachmentById: vi.fn(),
  findLabTestById: vi.fn(),
  findUserForPathology: vi.fn(),
  recordLabResultTx: vi.fn(),
}));

vi.mock('../src/modules/lab-tests/repositories/lab-test.repository', () => repositoryMocks);
vi.mock('../src/modules/audit/services/audit.service', () => ({ recordAuditLog: vi.fn() }));

import { recordLabResult } from '../src/modules/lab-tests/services/lab-test.service';

const principal = {
  authVersion: 1,
  departmentId: 'department-1',
  fullName: 'Kỹ thuật viên',
  id: 'lab-tech-1',
  isActive: true,
  mustChangePassword: false,
  permissions: ['lab_test.result.write'],
  roleCodes: ['lab_tech'],
  userId: 'lab-tech-1',
  username: 'lab.tech',
};

const baseLabTest = {
  id: 'lab-test-1',
  labTestType: { resultTableKey: 'xn_cong_thuc_mau' },
  status: 'ordered',
};

const baseInput = {
  attachmentId: 'attachment-1',
  resultTableKey: 'xn_cong_thuc_mau' as const,
  signatureConfirmation: true as const,
  signatureMethod: 'dev_e_confirmation' as const,
  structuredResult: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  repositoryMocks.findLabTestById.mockResolvedValue(baseLabTest);
  repositoryMocks.findAttachmentById.mockResolvedValue({
    ownerId: 'lab-test-1',
    ownerType: 'lab_test',
  });
  repositoryMocks.recordLabResultTx.mockResolvedValue({
    id: 'lab-test-1',
    resultedAt: new Date(),
    resultedBy: 'lab-tech-1',
    signedAt: new Date(),
    status: 'resulted',
  });
});

describe('recordLabResult', () => {
  it('maps a duplicate report code constraint to a stable 409 error', async () => {
    repositoryMocks.recordLabResultTx.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.20.0',
        meta: { target: ['unique_key_lab_test_report_code'] },
      }),
    );

    await expect(
      recordLabResult('lab-test-1', { ...baseInput, reportCode: 'LAB-001' }, principal),
    ).rejects.toMatchObject({
      code: 'REPORT_CODE_ALREADY_EXISTS',
      httpStatus: 409,
    });
  });

  it('rejects a pathology doctor that does not exist', async () => {
    repositoryMocks.findLabTestById.mockResolvedValue({
      ...baseLabTest,
      labTestType: { resultTableKey: 'xn_mo_benh_hoc' },
    });
    repositoryMocks.findUserForPathology.mockResolvedValue(null);

    await expect(
      recordLabResult(
        'lab-test-1',
        {
          ...baseInput,
          resultTableKey: 'xn_mo_benh_hoc',
          structuredResult: { bacSiGiaiPhauBenh: 'doctor-1' },
        } as never,
        principal,
      ),
    ).rejects.toMatchObject({ code: 'PATHOLOGY_DOCTOR_NOT_FOUND', httpStatus: 404 });
  });

  it('rejects a pathology doctor without the doctor role', async () => {
    repositoryMocks.findLabTestById.mockResolvedValue({
      ...baseLabTest,
      labTestType: { resultTableKey: 'xn_mo_benh_hoc' },
    });
    repositoryMocks.findUserForPathology.mockResolvedValue({
      isActive: true,
      permissions: [{ roleCode: 'lab_tech' }],
    });

    await expect(
      recordLabResult(
        'lab-test-1',
        {
          ...baseInput,
          resultTableKey: 'xn_mo_benh_hoc',
          structuredResult: { bacSiGiaiPhauBenh: 'doctor-1' },
        } as never,
        principal,
      ),
    ).rejects.toMatchObject({ code: 'PATHOLOGY_DOCTOR_ROLE_INVALID', httpStatus: 422 });
  });
});
