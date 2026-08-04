import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  repository: {
    findRecordForAdvance: vi.fn(),
    createDeposit: vi.fn(),
    createRefundIfWithinBalance: vi.fn(),
    listByRecordId: vi.fn(),
    countByRecordId: vi.fn(),
    calculateBalance: vi.fn(),
  },
  audit: vi.fn(),
}));

vi.mock('../src/modules/payment-advances/repositories/payment-advance.repository', () => ({
  paymentAdvanceRepository: mocks.repository,
}));

vi.mock('../src/core/ports/auditPort', () => ({
  auditPort: { record: mocks.audit },
}));

import {
  cancelInvoiceBodySchema,
  createInvoiceBodySchema,
  listInvoiceCandidatesQuerySchema,
  listInvoicesQuerySchema,
  writeOffInvoiceBodySchema,
} from '../src/modules/invoices/schemas/invoice.schemas';
import {
  createPaymentAdvanceBodySchema as createAdvanceBodySchema,
  createRefundBodySchema as createAdvanceRefundBodySchema,
  listPaymentAdvancesQuerySchema,
  recordIdParamSchema,
} from '../src/modules/payment-advances/schemas/payment-advance.schemas';
import {
  isInpatientRecord,
  paymentAdvanceService,
} from '../src/modules/payment-advances/services/payment-advance.service';

describe('accounting input validation', () => {
  it('rejects a cancellation reason made only of whitespace or shorter than ten characters', () => {
    expect(() =>
      cancelInvoiceBodySchema.parse({ expectedVersion: 1, cancelReason: '          ' }),
    ).toThrow();
    expect(() =>
      cancelInvoiceBodySchema.parse({ expectedVersion: 1, cancelReason: 'Sai' }),
    ).toThrow();
  });

  it('trims and accepts a valid cancellation reason', () => {
    const result = cancelInvoiceBodySchema.parse({
      expectedVersion: 1,
      cancelReason: '  Bệnh nhân đổi dịch vụ  ',
    });

    expect(result.cancelReason).toBe('Bệnh nhân đổi dịch vụ');
  });

  it('requires a valid version and a substantive write-off reason', () => {
    expect(() =>
      writeOffInvoiceBodySchema.parse({ expectedVersion: 0, writeOffReason: 'Cấp cứu' }),
    ).toThrow();
    expect(() =>
      writeOffInvoiceBodySchema.parse({ expectedVersion: 1, writeOffReason: 'Cấp cứu' }),
    ).toThrow();
  });

  it('requires positive integer deposit amounts and allows an optional deposit reason', () => {
    expect(() => createAdvanceBodySchema.parse({ amountVnd: 0, method: 'cash' })).toThrow();

    expect(
      createAdvanceBodySchema.parse({ amountVnd: 2_000_000, method: 'cash', reason: 'Nhập viện' }),
    ).toEqual({ amountVnd: 2_000_000, method: 'cash', reason: 'Nhập viện' });
  });

  it('requires a refund reason and rejects non-positive refunds', () => {
    expect(() =>
      createAdvanceRefundBodySchema.parse({ amountVnd: 800_000, reason: 'Ngắn' }),
    ).toThrow();
    expect(() =>
      createAdvanceRefundBodySchema.parse({ amountVnd: 0, reason: 'Hoàn trả sau xuất viện' }),
    ).toThrow();
  });

  it('classifies inpatient records by treatment type, bed assignment or department name', () => {
    expect(isInpatientRecord({ treatmentType: 'inpatient', bedId: null, department: null })).toBe(
      true,
    );
    expect(
      isInpatientRecord({ treatmentType: 'outpatient', bedId: 'bed-1', department: null }),
    ).toBe(true);
    expect(
      isInpatientRecord({
        treatmentType: 'outpatient',
        bedId: null,
        department: { name: 'Nội trú Da Liễu' },
      }),
    ).toBe(true);
    expect(isInpatientRecord({ treatmentType: 'outpatient', bedId: null, department: null })).toBe(
      false,
    );
  });
});

describe('invoice request schemas', () => {
  it.each([
    ['NO_COVERAGE', undefined],
    ['RATE_80', 'right_route'],
    ['RATE_95', 'referral'],
    ['RATE_100', 'emergency'],
  ] as const)('accepts benefit level %s with the required route shape', (benefitLevel, route) => {
    const result = createInvoiceBodySchema.parse({
      recordId: '11111111-1111-4111-8111-111111111111',
      healthInsuranceBenefitLevel: benefitLevel,
      ...(route ? { healthInsuranceRouteType: route } : {}),
    });

    expect(result.healthInsuranceBenefitLevel).toBe(benefitLevel);
  });

  it('rejects a health-insurance route when no coverage is selected', () => {
    expect(() =>
      createInvoiceBodySchema.parse({
        recordId: '11111111-1111-4111-8111-111111111111',
        healthInsuranceBenefitLevel: 'NO_COVERAGE',
        healthInsuranceRouteType: 'right_route',
      }),
    ).toThrow();
  });

  it.each([
    { healthInsuranceBenefitLevel: 'RATE_80' },
    { healthInsuranceBenefitLevel: 'RATE_80', healthInsuranceRouteType: 'unknown' },
    { healthInsuranceBenefitLevel: 'INVALID', healthInsuranceRouteType: 'right_route' },
    {
      healthInsuranceBenefitLevel: 'RATE_80',
      healthInsuranceRouteType: 'right_route',
      recordId: 'bad-id',
    },
  ])('rejects malformed invoice payload %#', (payload) => {
    expect(() => createInvoiceBodySchema.parse(payload)).toThrow();
  });

  it('applies safe pagination defaults and limits invoice candidate queries', () => {
    expect(listInvoiceCandidatesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 50 });
    expect(listInvoiceCandidatesQuerySchema.parse({ page: '2', pageSize: '100' })).toEqual({
      page: 2,
      pageSize: 100,
    });
    expect(() => listInvoiceCandidatesQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => listInvoiceCandidatesQuerySchema.parse({ pageSize: 101 })).toThrow();
  });

  it('accepts only supported invoice list statuses and positive pagination', () => {
    expect(listInvoicesQuerySchema.parse({ status: 'write_off' })).toMatchObject({
      status: 'write_off',
      page: 1,
      pageSize: 20,
    });
    expect(() => listInvoicesQuerySchema.parse({ status: 'draft' })).toThrow();
    expect(() => listInvoicesQuerySchema.parse({ page: 1.5 })).toThrow();
    expect(() => listInvoicesQuerySchema.parse({ pageSize: 101 })).toThrow();
  });
});

describe('invoice reason and optimistic version boundaries', () => {
  it.each([
    ['1234567890', true],
    ['123456789', false],
    ['x'.repeat(500), true],
    ['x'.repeat(501), false],
  ])('validates cancellation reason boundary %s', (reason, isValid) => {
    const parse = () => cancelInvoiceBodySchema.parse({ expectedVersion: 1, cancelReason: reason });
    if (isValid) expect(() => parse()).not.toThrow();
    else expect(() => parse()).toThrow();
  });

  it.each([0, -1, 1.5, Number.NaN, undefined])(
    'rejects invalid cancellation expectedVersion %#',
    (expectedVersion) => {
      expect(() =>
        cancelInvoiceBodySchema.parse({ expectedVersion, cancelReason: '1234567890' }),
      ).toThrow();
    },
  );

  it.each([
    ['1234567890', true],
    ['123456789', false],
    ['x'.repeat(500), true],
    ['x'.repeat(501), false],
  ])('validates write-off reason boundary %s', (reason, isValid) => {
    const parse = () =>
      writeOffInvoiceBodySchema.parse({ expectedVersion: 1, writeOffReason: reason });
    if (isValid) expect(() => parse()).not.toThrow();
    else expect(() => parse()).toThrow();
  });

  it('trims both cancellation and write-off reasons before service use', () => {
    expect(
      cancelInvoiceBodySchema.parse({ expectedVersion: 1, cancelReason: '  1234567890  ' })
        .cancelReason,
    ).toBe('1234567890');
    expect(
      writeOffInvoiceBodySchema.parse({ expectedVersion: 1, writeOffReason: '  1234567890  ' })
        .writeOffReason,
    ).toBe('1234567890');
  });
});

describe('payment advance request schemas', () => {
  it.each([1, '1', 2_000_000, Number.MAX_SAFE_INTEGER])(
    'accepts positive safe integer deposit amount %s',
    (amountVnd) => {
      expect(createAdvanceBodySchema.parse({ amountVnd, method: 'cash' }).amountVnd).toBe(
        Number(amountVnd),
      );
    },
  );

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '', 'abc', null])(
    'rejects invalid deposit amount %s',
    (amountVnd) => {
      expect(() => createAdvanceBodySchema.parse({ amountVnd, method: 'cash' })).toThrow();
    },
  );

  it.each(['cash', 'momo'] as const)('accepts deposit method %s', (method) => {
    expect(createAdvanceBodySchema.parse({ amountVnd: 1, method }).method).toBe(method);
  });

  it('rejects unsupported payment methods and trims optional deposit reason', () => {
    expect(() => createAdvanceBodySchema.parse({ amountVnd: 1, method: 'bank' })).toThrow();
    expect(
      createAdvanceBodySchema.parse({ amountVnd: 1, method: 'cash', reason: '  Nhập viện  ' })
        .reason,
    ).toBe('Nhập viện');
    expect(() =>
      createAdvanceBodySchema.parse({ amountVnd: 1, method: 'cash', reason: 'x'.repeat(501) }),
    ).toThrow();
  });

  it.each([
    ['1234567890', true],
    ['123456789', false],
    ['x'.repeat(500), true],
    ['x'.repeat(501), false],
    ['          ', false],
  ])('validates refund reason boundary %s', (reason, isValid) => {
    const parse = () => createAdvanceRefundBodySchema.parse({ amountVnd: 1, reason });
    if (isValid) expect(() => parse()).not.toThrow();
    else expect(() => parse()).toThrow();
  });

  it('validates medical-record UUID and payment-advance pagination limits', () => {
    expect(recordIdParamSchema.parse({ recordId: '11111111-1111-4111-8111-111111111111' })).toEqual(
      {
        recordId: '11111111-1111-4111-8111-111111111111',
      },
    );
    expect(() => recordIdParamSchema.parse({ recordId: 'not-a-uuid' })).toThrow();
    expect(listPaymentAdvancesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 50 });
    expect(() => listPaymentAdvancesQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => listPaymentAdvancesQuerySchema.parse({ pageSize: 101 })).toThrow();
  });
});

describe('payment advance service business rules', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const inpatientRecord = {
    id: 'record-1',
    treatmentType: 'inpatient' as const,
    bedId: null,
    department: null,
  };

  const createdAdvance = {
    id: 'advance-1',
    type: 'deposit' as const,
    amount: new Prisma.Decimal(2_000_000),
    method: 'cash' as const,
    reason: 'Nhập viện',
    receiptNumber: 'AD-20260804-001',
    createdAt: new Date('2026-08-04T00:00:00.000Z'),
  };

  it('requires an authenticated actor before creating a deposit', async () => {
    await expect(
      paymentAdvanceService.createDeposit({
        recordId: 'record-1',
        amountVnd: 2_000_000,
        method: 'cash',
      }),
    ).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHENTICATED' });
    expect(mocks.repository.createDeposit).not.toHaveBeenCalled();
  });

  it('blocks deposits for an outpatient record before persistence', async () => {
    mocks.repository.findRecordForAdvance.mockResolvedValueOnce({
      ...inpatientRecord,
      treatmentType: 'outpatient',
    });

    await expect(
      paymentAdvanceService.createDeposit({
        recordId: 'record-1',
        amountVnd: 2_000_000,
        method: 'cash',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'ADVANCE_ONLY_FOR_INPATIENT' });
    expect(mocks.repository.createDeposit).not.toHaveBeenCalled();
  });

  it('creates a deposit, maps money to the API contract and records an audit event', async () => {
    mocks.repository.findRecordForAdvance.mockResolvedValueOnce(inpatientRecord);
    mocks.repository.createDeposit.mockResolvedValueOnce(createdAdvance);

    await expect(
      paymentAdvanceService.createDeposit({
        recordId: 'record-1',
        amountVnd: 2_000_000,
        method: 'cash',
        reason: 'Nhập viện',
        actorUserId: 'user-1',
      }),
    ).resolves.toMatchObject({
      id: 'advance-1',
      amount: '2000000.00',
      receiptNumber: 'AD-20260804-001',
    });
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment_advance.deposit', userId: 'user-1' }),
    );
  });

  it('rejects a refund when the repository reports insufficient balance', async () => {
    mocks.repository.findRecordForAdvance.mockResolvedValueOnce(inpatientRecord);
    mocks.repository.createRefundIfWithinBalance.mockResolvedValueOnce({
      created: null,
      balance: {
        totalDeposited: new Prisma.Decimal(100),
        totalRefunded: new Prisma.Decimal(0),
        balance: new Prisma.Decimal(100),
      },
    });

    await expect(
      paymentAdvanceService.createRefund({
        recordId: 'record-1',
        amountVnd: 101,
        method: 'cash',
        reason: 'Hoàn trả sau xuất viện',
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'REFUND_EXCEEDS_BALANCE' });
    expect(mocks.audit).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment_advance.refund' }),
    );
  });

  it('lists history with money strings and calculated pagination', async () => {
    mocks.repository.findRecordForAdvance.mockResolvedValueOnce(inpatientRecord);
    mocks.repository.listByRecordId.mockResolvedValueOnce([createdAdvance]);
    mocks.repository.countByRecordId.mockResolvedValueOnce(3);
    mocks.repository.calculateBalance.mockResolvedValueOnce({
      totalDeposited: new Prisma.Decimal(2_000_000),
      totalRefunded: new Prisma.Decimal(500_000),
      balance: new Prisma.Decimal(1_500_000),
    });

    await expect(
      paymentAdvanceService.list({
        recordId: 'record-1',
        page: 2,
        pageSize: 2,
        actorUserId: 'user-1',
      }),
    ).resolves.toMatchObject({
      balance: '1500000.00',
      pagination: { page: 2, pageSize: 2, totalItems: 3, totalPages: 2 },
    });
    expect(mocks.repository.listByRecordId).toHaveBeenCalledWith('record-1', 2, 2);
  });
});
