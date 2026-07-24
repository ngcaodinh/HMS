import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendSuccess, sendError } from '../src/core/http/response-envelope';
import { BillingSettlementPort } from '../src/ports/BillingSettlementPort';

const { mockPrisma } = vi.hoisted(() => {
  const mockPrismaObj: any = {
    medicalRecord: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bed: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bedAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dischargeSummary: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    treatmentOrder: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb(mockPrismaObj)),
  };
  return { mockPrisma: mockPrismaObj };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    BedStatus: { available: 'available', occupied: 'occupied', maintenance: 'maintenance' },
    TreatmentOrderStatus: { active: 'active', done: 'done', cancelled: 'cancelled', delayed: 'delayed' },
    TreatmentOrderType: { medication: 'medication', monitoring: 'monitoring', care: 'care', diet: 'diet', procedure: 'procedure' },
    TreatmentType: { outpatient: 'outpatient', inpatient: 'inpatient' },
    MedicalRecordStatus: { open: 'open', waiting_results: 'waiting_results', diagnosed: 'diagnosed', closed: 'closed' },
    ReleaseReason: { transfer: 'transfer', correction: 'correction', discharge: 'discharge' },
  };
});

import { InpatientController } from '../src/modules/inpatient/inpatient.controller';

describe('Response Envelope Utilities', () => {
  it('should format success envelope correctly', () => {
    const res: any = {
      status: (code: number) => {
        expect(code).toBe(200);
        return res;
      },
      json: (body: any) => {
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('meta');
        expect(body.data).toEqual({ test: true });
        return body;
      },
      req: { id: 'req-123' },
    };

    sendSuccess(res, { test: true });
  });

  it('should format error envelope correctly', () => {
    const res: any = {
      status: (code: number) => {
        expect(code).toBe(400);
        return res;
      },
      json: (body: any) => {
        expect(body).toHaveProperty('error');
        expect(body.error.code).toBe('BAD_REQUEST');
        expect(body.error.message).toBe('Invalid data');
        return body;
      },
      req: { id: 'req-456' },
    };

    sendError(res, 400, 'BAD_REQUEST', 'Invalid data');
  });
});

describe('InpatientController Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignBed', () => {
    it('should throw VERSION_CONFLICT when record version does not match expectedRecordVersion', async () => {
      const req: any = {
        params: { recordId: 'rec-1' },
        body: { bedId: 'bed-1', expectedRecordVersion: 1 },
      };
      const res: any = {};

      mockPrisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        version: 2,
        treatmentType: 'inpatient',
      });

      await expect(InpatientController.assignBed(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 409,
          code: 'VERSION_CONFLICT',
        })
      );
    });

    it('should throw BED_UNAVAILABLE when target bed is not available', async () => {
      const req: any = {
        params: { recordId: 'rec-1' },
        body: { bedId: 'bed-1', expectedRecordVersion: 1 },
      };
      const res: any = {};

      mockPrisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        version: 1,
        treatmentType: 'inpatient',
      });
      mockPrisma.bed.findUnique.mockResolvedValue({
        id: 'bed-1',
        status: 'occupied',
      });

      await expect(InpatientController.assignBed(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'BED_UNAVAILABLE',
        })
      );
    });
  });

  describe('changeBedAssignment', () => {
    it('should throw TARGET_BED_REQUIRED when action is transfer but targetBedId is missing', async () => {
      const req: any = {
        params: { recordId: 'rec-1' },
        body: { action: 'transfer', expectedRecordVersion: 1, reason: 'Reason text over 10 chars' },
      };
      const res: any = {};

      mockPrisma.bedAssignment.findFirst.mockResolvedValue({
        id: 'assign-1',
        bedId: 'bed-1',
        record: { id: 'rec-1', version: 1 },
      });

      await expect(InpatientController.changeBedAssignment(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'TARGET_BED_REQUIRED',
        })
      );
    });
  });

  describe('completeTreatmentOrder', () => {
    it('should throw INVALID_TREATMENT_ORDER_TRANSITION when order is not active', async () => {
      const req: any = {
        params: { treatmentOrderId: 'order-1' },
        body: {},
      };
      const res: any = {};

      mockPrisma.treatmentOrder.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'done',
      });

      await expect(InpatientController.completeTreatmentOrder(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 409,
          code: 'INVALID_TREATMENT_ORDER_TRANSITION',
        })
      );
    });
  });

  describe('processDischarge', () => {
    it('should throw DISCHARGE_SUMMARY_REQUIRED when signed discharge summary is missing', async () => {
      const req: any = {
        params: { recordId: 'rec-1' },
        body: { expectedRecordVersion: 1, dischargeConfirmation: true },
      };
      const res: any = {};

      mockPrisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        version: 1,
      });
      mockPrisma.bedAssignment.findFirst.mockResolvedValue({
        id: 'assign-1',
        bedId: 'bed-1',
      });
      mockPrisma.dischargeSummary.findUnique.mockResolvedValue(null);

      await expect(InpatientController.processDischarge(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'DISCHARGE_SUMMARY_REQUIRED',
        })
      );
    });

    it('should throw UNPAID_INVOICE when billing settlement returns false', async () => {
      const req: any = {
        params: { recordId: 'rec-1' },
        body: { expectedRecordVersion: 1, dischargeConfirmation: true },
      };
      const res: any = {};

      mockPrisma.medicalRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        version: 1,
      });
      mockPrisma.bedAssignment.findFirst.mockResolvedValue({
        id: 'assign-1',
        bedId: 'bed-1',
      });
      mockPrisma.dischargeSummary.findUnique.mockResolvedValue({
        id: 'sum-1',
        signedAt: new Date(),
      });

      vi.spyOn(BillingSettlementPort, 'canFinalizeRecord').mockResolvedValueOnce(false);

      await expect(InpatientController.processDischarge(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'UNPAID_INVOICE',
        })
      );
    });
  });

  describe('listOrders', () => {
    it('should throw ORDER_SCOPE_REQUIRED when no recordId, bedId, or departmentId query is provided', async () => {
      const req: any = {
        query: {},
      };
      const res: any = {};

      await expect(InpatientController.listOrders(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'ORDER_SCOPE_REQUIRED',
        })
      );
    });
  });
});
