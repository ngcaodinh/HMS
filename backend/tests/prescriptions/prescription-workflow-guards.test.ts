import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cancelPrescriptionTx: vi.fn(),
  dispensePrescriptionTx: vi.fn(),
  findPrescriptionById: vi.fn(),
  recordAuditLog: vi.fn(),
}));

vi.mock('../../src/config/unifiedConfig', () => ({ config: {} }));
vi.mock('../../src/modules/audit/services/audit.service', () => ({
  recordAuditLog: mocks.recordAuditLog,
}));
vi.mock('../../src/modules/prescriptions/repositories/prescription.repository', () => ({
  cancelPrescriptionTx: mocks.cancelPrescriptionTx,
  dispensePrescriptionTx: mocks.dispensePrescriptionTx,
  findPrescriptionById: mocks.findPrescriptionById,
}));

import {
  cancelPrescription,
  dispensePrescription,
} from '../../src/modules/prescriptions/services/prescription.service';

const pharmacist = {
  id: 'user-pharmacist-1',
  userId: 'user-pharmacist-1',
  username: 'pharmacist',
  fullName: 'Pharmacist One',
  roleCodes: ['pharmacist'],
  permissions: ['pharmacy.inventory.read'],
  departmentId: 'pharmacy',
  isActive: true,
  mustChangePassword: false,
  authVersion: 1,
};

function createPrescription(status: string, dispensedAt: Date | null = null) {
  return {
    id: 'prescription-1',
    status,
    dispensedAt,
    medicalRecord: { doctorId: 'doctor-1' },
  };
}

describe('prescription workflow service guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['draft', 'INVALID_PRESCRIPTION_TRANSITION'],
    ['cancelled', 'INVALID_PRESCRIPTION_TRANSITION'],
  ])('rejects cancellation from %s status before starting a transaction', async (status, code) => {
    mocks.findPrescriptionById.mockResolvedValue(createPrescription(status));

    await expect(cancelPrescription('prescription-1', pharmacist, {
      expectedVersion: 1,
      cancelReason: 'Ly do hop le dai',
    })).rejects.toMatchObject({ code });
    expect(mocks.cancelPrescriptionTx).not.toHaveBeenCalled();
  });

  it('allows cancellation from xml_exported and records the audit event', async () => {
    mocks.findPrescriptionById.mockResolvedValue(createPrescription('xml_exported'));
    mocks.cancelPrescriptionTx.mockResolvedValue({
      id: 'prescription-1',
      status: 'cancelled',
      cancelledAt: new Date('2026-08-04T10:00:00.000Z'),
      version: 2,
    });

    await expect(cancelPrescription('prescription-1', pharmacist, {
      expectedVersion: 1,
      cancelReason: 'Ly do hop le dai',
    })).resolves.toMatchObject({ prescriptionId: 'prescription-1', status: 'cancelled', version: 2 });
    expect(mocks.recordAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects cancellation when the transaction loses its version race', async () => {
    mocks.findPrescriptionById.mockResolvedValue(createPrescription('active'));
    mocks.cancelPrescriptionTx.mockResolvedValue(null);

    await expect(cancelPrescription('prescription-1', pharmacist, {
      expectedVersion: 1,
      cancelReason: 'Ly do hop le dai',
    })).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(mocks.recordAuditLog).not.toHaveBeenCalled();
  });

  it.each([
    ['draft', null, 'PRESCRIPTION_NOT_SIGNED'],
    ['active', new Date('2026-08-04T09:00:00.000Z'), 'PRESCRIPTION_ALREADY_DISPENSED'],
  ])('rejects dispensing from %s state before invoice transaction', async (status, dispensedAt, code) => {
    mocks.findPrescriptionById.mockResolvedValue(createPrescription(status, dispensedAt));

    await expect(dispensePrescription('prescription-1', pharmacist.userId, 1)).rejects
      .toMatchObject({ code });
    expect(mocks.dispensePrescriptionTx).not.toHaveBeenCalled();
  });

  it('rejects a missing prescription without attempting to dispense', async () => {
    mocks.findPrescriptionById.mockResolvedValue(null);

    await expect(dispensePrescription('prescription-1', pharmacist.userId, 1)).rejects
      .toMatchObject({ code: 'PRESCRIPTION_NOT_FOUND' });
    expect(mocks.dispensePrescriptionTx).not.toHaveBeenCalled();
  });

  it('returns a successful active dispense and records the audit event', async () => {
    mocks.findPrescriptionById.mockResolvedValue(createPrescription('active'));
    mocks.dispensePrescriptionTx.mockResolvedValue({
      id: 'prescription-1',
      dispensedBy: pharmacist.userId,
      dispensedAt: new Date('2026-08-04T10:00:00.000Z'),
      version: 2,
    });

    await expect(dispensePrescription('prescription-1', pharmacist.userId, 1)).resolves.toMatchObject({
      prescriptionId: 'prescription-1',
      dispensedBy: pharmacist.userId,
      version: 2,
    });
    expect(mocks.recordAuditLog).toHaveBeenCalledTimes(1);
  });

  it('maps a lost dispense version race to a conflict and skips audit', async () => {
    mocks.findPrescriptionById.mockResolvedValue(createPrescription('xml_exported'));
    mocks.dispensePrescriptionTx.mockResolvedValue(null);

    await expect(dispensePrescription('prescription-1', pharmacist.userId, 1)).rejects
      .toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(mocks.recordAuditLog).not.toHaveBeenCalled();
  });
});
