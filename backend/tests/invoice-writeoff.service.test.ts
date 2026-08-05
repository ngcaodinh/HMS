import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getVietnamLegalDate } from '../src/core/time/vietnamClock';

const mocks = vi.hoisted(() => ({
  repository: {
    findMedicalRecord: vi.fn(),
    findPendingByRecordId: vi.fn(),
    findServiceOrdersForRecord: vi.fn(),
    createWithItems: vi.fn(),
    findById: vi.fn(),
    writeOffEmergency: vi.fn(),
    closeRecordIfOpen: vi.fn(),
  },
  audit: vi.fn(),
  setSettlementPort: vi.fn(),
  setPaymentIntentPort: vi.fn(),
}));

vi.mock('../src/modules/invoices/repositories/invoice.repository', () => ({
  invoiceRepository: mocks.repository,
}));

vi.mock('../src/core/ports/auditPort', () => ({
  auditPort: { record: mocks.audit },
}));

vi.mock('../src/core/ports/billingSettlementPort', () => ({
  setBillingSettlementPort: mocks.setSettlementPort,
}));

vi.mock('../src/core/ports/billingPaymentIntentPort', () => ({
  setBillingPaymentIntentPort: mocks.setPaymentIntentPort,
}));

import { invoiceService } from '../src/modules/invoices/services/invoice.service';

const pendingEmergencyInvoice = {
  id: 'invoice-1',
  recordId: 'record-1',
  status: 'pending' as const,
  healthInsuranceBenefitLevel: 'NO_COVERAGE' as const,
  healthInsuranceRouteType: null,
  healthInsuranceBenefitRateSnapshot: '0.0000',
  healthInsuranceRuleSource: 'draft',
  subtotal: new Prisma.Decimal(1_000_000),
  healthInsuranceBaseAmount: new Prisma.Decimal(0),
  healthInsuranceDiscountAmount: new Prisma.Decimal(0),
  totalAmount: new Prisma.Decimal(1_000_000),
  advanceAppliedAmount: new Prisma.Decimal(0),
  amountDue: new Prisma.Decimal(1_000_000),
  paymentMethod: null,
  receiptNumber: null,
  paidAt: null,
  momoOrderId: null,
  statementStatus: 'draft',
  statementNumber: null,
  version: 1,
  createdAt: new Date('2026-08-04T00:00:00.000Z'),
  updatedAt: new Date('2026-08-04T00:00:00.000Z'),
  cancelReason: null,
  cancelledAt: null,
  writeOffReason: null,
  writeOffAt: null,
  items: [],
  claim: null,
  medicalRecord: {
    id: 'record-1',
    recordCode: 'HS-001',
    status: 'open',
    isEmergency: true,
    patientId: 'patient-1',
    patient: {
      id: 'patient-1',
      patientCode: 'BN-001',
      fullName: 'Nguyễn Văn A',
      healthInsuranceCode: null,
      healthInsuranceExpiryDate: null,
    },
  },
};

describe('InvoiceService.writeOffInvoice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('requires an authenticated actor before reading invoice data', async () => {
    await expect(
      invoiceService.writeOffInvoice({
        invoiceId: 'invoice-1',
        expectedVersion: 1,
        writeOffReason: 'Cấp cứu không thu được',
      }),
    ).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHENTICATED' });
    expect(mocks.repository.findById).not.toHaveBeenCalled();
  });

  it('returns not found when the invoice does not exist', async () => {
    mocks.repository.findById.mockResolvedValueOnce(null);

    await expect(
      invoiceService.writeOffInvoice({
        invoiceId: 'invoice-1',
        expectedVersion: 1,
        writeOffReason: 'Cấp cứu không thu được',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'INVOICE_NOT_FOUND' });
  });

  it('rejects an invoice that is already paid or cancelled', async () => {
    mocks.repository.findById.mockResolvedValueOnce({
      ...pendingEmergencyInvoice,
      status: 'paid',
    });

    await expect(
      invoiceService.writeOffInvoice({
        invoiceId: 'invoice-1',
        expectedVersion: 1,
        writeOffReason: 'Cấp cứu không thu được',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'INVOICE_NOT_PENDING' });
    expect(mocks.repository.writeOffEmergency).not.toHaveBeenCalled();
  });

  it('rejects a pending invoice whose medical record is not emergency', async () => {
    mocks.repository.findById.mockResolvedValueOnce({
      ...pendingEmergencyInvoice,
      medicalRecord: { ...pendingEmergencyInvoice.medicalRecord, isEmergency: false },
    });

    await expect(
      invoiceService.writeOffInvoice({
        invoiceId: 'invoice-1',
        expectedVersion: 1,
        writeOffReason: 'Cấp cứu không thu được',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'WRITE_OFF_NOT_ALLOWED_NON_EMERGENCY' });
  });

  it('returns a conflict when optimistic version update loses the race', async () => {
    mocks.repository.findById.mockResolvedValueOnce(pendingEmergencyInvoice);
    mocks.repository.writeOffEmergency.mockResolvedValueOnce(null);

    await expect(
      invoiceService.writeOffInvoice({
        invoiceId: 'invoice-1',
        expectedVersion: 1,
        writeOffReason: 'Cấp cứu không thu được',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'INVOICE_NOT_PENDING' });
    expect(mocks.repository.closeRecordIfOpen).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it('writes off emergency invoice, closes the record and audits the approval', async () => {
    mocks.repository.findById.mockResolvedValueOnce(pendingEmergencyInvoice);
    mocks.repository.writeOffEmergency.mockResolvedValueOnce({
      ...pendingEmergencyInvoice,
      status: 'write_off',
      version: 2,
      writeOffReason: 'Cấp cứu không thu được',
      writeOffAt: new Date('2026-08-04T00:00:00.000Z'),
    });

    await expect(
      invoiceService.writeOffInvoice({
        invoiceId: 'invoice-1',
        expectedVersion: 1,
        writeOffReason: 'Cấp cứu không thu được',
        actorUserId: 'user-1',
      }),
    ).resolves.toMatchObject({ invoiceId: 'invoice-1', status: 'write_off', version: 2 });
    expect(mocks.repository.closeRecordIfOpen).toHaveBeenCalledWith('record-1');
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'invoice.write_off', resourceId: 'invoice-1' }),
    );
  });
});

describe('InvoiceService.createInvoice duplicate protection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the existing pending invoice id when duplicate creation is attempted', async () => {
    mocks.repository.findMedicalRecord.mockResolvedValueOnce({
      patient: { healthInsuranceCode: null, healthInsuranceExpiryDate: null },
    });
    mocks.repository.findPendingByRecordId.mockResolvedValueOnce({ id: 'invoice-existing' });

    await expect(
      invoiceService.createInvoice({
        recordId: 'record-1',
        healthInsuranceBenefitLevel: 'NO_COVERAGE',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'INVOICE_ALREADY_EXISTS',
      details: [{ field: 'invoiceId', message: 'invoice-existing' }],
    });
  });
});

describe('InvoiceService.createInvoice calculation and eligibility matrix', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.repository.findPendingByRecordId.mockResolvedValue(null);
  });

  const validExpiry = new Date(Date.UTC(2099, 0, 1));
  const todayExpiry = getVietnamLegalDate();
  const expiredExpiry = new Date(Date.UTC(2000, 0, 1));
  const coveredOrder = {
    id: 'order-covered',
    fee: new Prisma.Decimal(500_000),
    serviceCatalog: {
      id: 'catalog-1',
      code: 'CONSULT_OUTPATIENT',
      name: 'Khám bệnh ngoại trú',
      coveredByHealthInsurance: true,
      healthInsuranceCeilingPrice: new Prisma.Decimal(300_000),
    },
  };
  const nonCoveredOrder = {
    id: 'order-private',
    fee: new Prisma.Decimal(200_000),
    serviceCatalog: {
      id: 'catalog-2',
      code: 'PRIVATE_SERVICE',
      name: 'Dịch vụ tự chọn',
      coveredByHealthInsurance: false,
      healthInsuranceCeilingPrice: null,
    },
  };

  const createInvoiceResult = (overrides: Record<string, unknown> = {}) => ({
    ...pendingEmergencyInvoice,
    status: 'pending' as const,
    healthInsuranceBenefitLevel: 'RATE_80' as const,
    healthInsuranceRouteType: 'right_route' as const,
    healthInsuranceBenefitRateSnapshot: '0.8000',
    subtotal: new Prisma.Decimal(700_000),
    healthInsuranceBaseAmount: new Prisma.Decimal(300_000),
    healthInsuranceDiscountAmount: new Prisma.Decimal(240_000),
    totalAmount: new Prisma.Decimal(460_000),
    amountDue: new Prisma.Decimal(460_000),
    items: [
      {
        id: 'item-1',
        description: coveredOrder.serviceCatalog.name,
        category: 'consultation' as const,
        quantity: new Prisma.Decimal(1),
        unitPrice: coveredOrder.fee,
        amount: coveredOrder.fee,
        coveredByHealthInsurance: true,
        healthInsuranceBenefitLevel: 'RATE_80' as const,
        healthInsuranceBenefitRateSnapshot: '0.8000',
        healthInsuranceEligibleAmount: new Prisma.Decimal(300_000),
        healthInsuranceCeilingAmount: new Prisma.Decimal(300_000),
        healthInsuranceFundAmount: new Prisma.Decimal(240_000),
        patientCoPayAmount: new Prisma.Decimal(260_000),
        sortOrder: 0,
      },
    ],
    claim: { id: 'claim-1', status: 'draft' as const },
    ...overrides,
  });

  it('rejects a missing record before checking pending invoices', async () => {
    mocks.repository.findMedicalRecord.mockResolvedValue(null);

    await expect(
      invoiceService.createInvoice({
        recordId: 'record-1',
        healthInsuranceBenefitLevel: 'RATE_80',
        healthInsuranceRouteType: 'right_route',
      }),
    ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
    expect(mocks.repository.findPendingByRecordId).not.toHaveBeenCalled();
  });

  it('rejects a record without service orders', async () => {
    mocks.repository.findMedicalRecord.mockResolvedValue({
      patient: { healthInsuranceCode: 'CARD-1', healthInsuranceExpiryDate: validExpiry },
    });
    mocks.repository.findServiceOrdersForRecord.mockResolvedValue([]);

    await expect(
      invoiceService.createInvoice({
        recordId: 'record-1',
        healthInsuranceBenefitLevel: 'RATE_80',
        healthInsuranceRouteType: 'right_route',
      }),
    ).rejects.toMatchObject({ code: 'INCOMPLETE_COST_DATA' });
    expect(mocks.repository.createWithItems).not.toHaveBeenCalled();
  });

  it.each([
    ['missing card', null, validExpiry],
    ['missing expiry', 'CARD-1', null],
    ['expired card', 'CARD-1', expiredExpiry],
  ] as const)('forces NO_COVERAGE for %s', async (_label, healthInsuranceCode, expiry) => {
    mocks.repository.findMedicalRecord.mockResolvedValue({
      patient: { healthInsuranceCode, healthInsuranceExpiryDate: expiry },
    });
    mocks.repository.findServiceOrdersForRecord.mockResolvedValue([coveredOrder]);
    mocks.repository.createWithItems.mockResolvedValue(
      createInvoiceResult({
        healthInsuranceBenefitLevel: 'NO_COVERAGE',
        healthInsuranceRouteType: null,
        healthInsuranceBenefitRateSnapshot: '0.0000',
        healthInsuranceBaseAmount: new Prisma.Decimal(0),
        healthInsuranceDiscountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(500_000),
        amountDue: new Prisma.Decimal(500_000),
        items: [
          {
            ...createInvoiceResult().items[0],
            coveredByHealthInsurance: false,
            healthInsuranceBenefitLevel: null,
            healthInsuranceBenefitRateSnapshot: null,
            healthInsuranceEligibleAmount: new Prisma.Decimal(0),
            healthInsuranceCeilingAmount: new Prisma.Decimal(0),
            healthInsuranceFundAmount: new Prisma.Decimal(0),
            patientCoPayAmount: new Prisma.Decimal(500_000),
          },
        ],
        claim: null,
      }),
    );

    await invoiceService.createInvoice({
      recordId: 'record-1',
      healthInsuranceBenefitLevel: 'RATE_80',
      healthInsuranceRouteType: 'right_route',
    });

    expect(mocks.repository.createWithItems).toHaveBeenCalledWith(
      expect.objectContaining({
        healthInsuranceBenefitLevel: 'NO_COVERAGE',
        healthInsuranceRouteType: null,
        healthInsuranceDiscountAmount: new Prisma.Decimal(0),
        createClaim: false,
      }),
    );
  });

  it('calculates covered and private lines, ceiling, category and claim snapshot', async () => {
    mocks.repository.findMedicalRecord.mockResolvedValue({
      patient: { healthInsuranceCode: 'CARD-1', healthInsuranceExpiryDate: validExpiry },
    });
    mocks.repository.findServiceOrdersForRecord.mockResolvedValue([coveredOrder, nonCoveredOrder]);
    mocks.repository.createWithItems.mockResolvedValue(createInvoiceResult());

    await invoiceService.createInvoice({
      recordId: 'record-1',
      healthInsuranceBenefitLevel: 'RATE_80',
      healthInsuranceRouteType: 'right_route',
    });

    expect(mocks.repository.createWithItems).toHaveBeenCalledWith(
      expect.objectContaining({
        healthInsuranceBenefitLevel: 'RATE_80',
        healthInsuranceBenefitRateSnapshot: '0.8000',
        subtotal: new Prisma.Decimal(700_000),
        healthInsuranceBaseAmount: new Prisma.Decimal(300_000),
        healthInsuranceDiscountAmount: new Prisma.Decimal(240_000),
        totalAmount: new Prisma.Decimal(460_000),
        createClaim: true,
        items: expect.arrayContaining([
          expect.objectContaining({
            category: 'consultation',
            healthInsuranceEligibleAmount: new Prisma.Decimal(300_000),
            healthInsuranceFundAmount: new Prisma.Decimal(240_000),
          }),
          expect.objectContaining({
            category: 'other',
            coveredByHealthInsurance: false,
            patientCoPayAmount: new Prisma.Decimal(200_000),
          }),
        ]),
      }),
    );
  });

  it('accepts a card whose expiry is the current Vietnam legal date', async () => {
    mocks.repository.findMedicalRecord.mockResolvedValue({
      patient: { healthInsuranceCode: 'CARD-1', healthInsuranceExpiryDate: todayExpiry },
    });
    mocks.repository.findServiceOrdersForRecord.mockResolvedValue([coveredOrder]);
    mocks.repository.createWithItems.mockResolvedValue(createInvoiceResult());

    await invoiceService.createInvoice({
      recordId: 'record-1',
      healthInsuranceBenefitLevel: 'RATE_80',
      healthInsuranceRouteType: 'right_route',
    });

    expect(mocks.repository.createWithItems).toHaveBeenCalledWith(
      expect.objectContaining({ healthInsuranceBenefitLevel: 'RATE_80' }),
    );
  });

  it('maps every supported service category without changing the server calculation', async () => {
    const categories = [
      ['LAB-01', 'Xét nghiệm máu', 'lab'],
      ['THUOC-01', 'Thuốc bôi', 'medicine'],
      ['GIUONG-01', 'Giường điều trị', 'bed'],
      ['PHAU-01', 'Phẫu thuật nhỏ', 'procedure'],
      ['KHAM-01', 'Khám chuyên khoa', 'consultation'],
    ] as const;
    mocks.repository.findMedicalRecord.mockResolvedValue({
      patient: { healthInsuranceCode: null, healthInsuranceExpiryDate: null },
    });
    mocks.repository.findServiceOrdersForRecord.mockResolvedValue(
      categories.map(([code, name], index) => ({
        id: `order-${index}`,
        fee: new Prisma.Decimal(100_000),
        serviceCatalog: {
          id: `catalog-${index}`,
          code,
          name,
          coveredByHealthInsurance: false,
          healthInsuranceCeilingPrice: null,
        },
      })),
    );
    mocks.repository.createWithItems.mockResolvedValue(
      createInvoiceResult({
        healthInsuranceBenefitLevel: 'NO_COVERAGE',
        healthInsuranceRouteType: null,
        healthInsuranceBenefitRateSnapshot: '0.0000',
        healthInsuranceBaseAmount: new Prisma.Decimal(0),
        healthInsuranceDiscountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(500_000),
        amountDue: new Prisma.Decimal(500_000),
        claim: null,
      }),
    );

    await invoiceService.createInvoice({
      recordId: 'record-1',
      healthInsuranceBenefitLevel: 'NO_COVERAGE',
    });

    const params = mocks.repository.createWithItems.mock.calls[0]?.[0];
    expect(params.items.map((item: { category: string }) => item.category)).toEqual(
      categories.map(([, , category]) => category),
    );
  });
});
