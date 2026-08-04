import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  repository: {
    findMedicalRecord: vi.fn(),
    findPendingByRecordId: vi.fn(),
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
