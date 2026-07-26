import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  const mockPrismaObj: any = {
    specimenCollection: {
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
    SpecimenStatus: {
      pending: 'pending',
      collected: 'collected',
      handed_over: 'handed_over',
    },
  };
});

import { SpecimenController } from '../src/modules/specimens/specimen.controller';

describe('SpecimenController Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listSpecimens', () => {
    it('should return specimens list wrapped in response envelope', async () => {
      const mockList = [
        {
          id: 'spec-1',
          specimenCode: 'DL-2607-001',
          status: 'pending',
          patientName: 'NGUYỄN VĂN A',
        },
      ];
      mockPrisma.specimenCollection.findMany.mockResolvedValue(mockList);

      const req: any = { query: {} };
      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (body: any) => {
          expect(body).toHaveProperty('data');
          expect(body.data).toEqual(mockList);
          return body;
        },
        req: { id: 'req-123' },
      };

      await SpecimenController.listSpecimens(req, res);
      expect(mockPrisma.specimenCollection.findMany).toHaveBeenCalled();
    });
  });

  describe('collectSpecimen', () => {
    it('should throw SPECIMEN_ALREADY_COLLECTED when status is not pending', async () => {
      const req: any = {
        params: { id: 'spec-1' },
        user: { id: 'usr-nurse-01' },
      };
      const res: any = {};

      mockPrisma.specimenCollection.findUnique.mockResolvedValue({
        id: 'spec-1',
        status: 'collected',
      });

      await expect(SpecimenController.collectSpecimen(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'SPECIMEN_ALREADY_COLLECTED',
        })
      );
    });

    it('should collect specimen successfully when status is pending', async () => {
      const req: any = {
        params: { id: 'spec-1' },
        user: { id: 'usr-nurse-01' },
      };
      const mockRecord = {
        id: 'spec-1',
        status: 'pending',
        specimenCode: 'DL-2607-001',
      };
      const mockUpdated = {
        ...mockRecord,
        status: 'collected',
        collectedBy: 'usr-nurse-01',
      };

      mockPrisma.specimenCollection.findUnique.mockResolvedValue(mockRecord);
      mockPrisma.specimenCollection.update.mockResolvedValue(mockUpdated);

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (body: any) => {
          expect(body.data).toEqual(mockUpdated);
          return body;
        },
        req: { id: 'req-123' },
      };

      await SpecimenController.collectSpecimen(req, res);
      expect(mockPrisma.specimenCollection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'spec-1' },
          data: expect.objectContaining({ status: 'collected' }),
        })
      );
    });
  });

  describe('handoffSpecimen', () => {
    it('should throw SPECIMEN_NOT_COLLECTED when status is not collected', async () => {
      const req: any = {
        params: { id: 'spec-1' },
        body: { labReceiverName: 'Lab Tech A' },
        user: { id: 'usr-nurse-01' },
      };
      const res: any = {};

      mockPrisma.specimenCollection.findUnique.mockResolvedValue({
        id: 'spec-1',
        status: 'pending',
      });

      await expect(SpecimenController.handoffSpecimen(req, res)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          code: 'SPECIMEN_NOT_COLLECTED',
        })
      );
    });

    it('should handoff specimen successfully when status is collected', async () => {
      const req: any = {
        params: { id: 'spec-1' },
        body: { labReceiverName: 'Lab Tech A' },
        user: { id: 'usr-nurse-01' },
      };
      const mockRecord = {
        id: 'spec-1',
        status: 'collected',
        specimenCode: 'DL-2607-001',
      };
      const mockUpdated = {
        ...mockRecord,
        status: 'handed_over',
        handedOverBy: 'usr-nurse-01',
        labReceiverName: 'Lab Tech A',
      };

      mockPrisma.specimenCollection.findUnique.mockResolvedValue(mockRecord);
      mockPrisma.specimenCollection.update.mockResolvedValue(mockUpdated);

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (body: any) => {
          expect(body.data).toEqual(mockUpdated);
          return body;
        },
        req: { id: 'req-123' },
      };

      await SpecimenController.handoffSpecimen(req, res);
      expect(mockPrisma.specimenCollection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'spec-1' },
          data: expect.objectContaining({ status: 'handed_over' }),
        })
      );
    });
  });
});
