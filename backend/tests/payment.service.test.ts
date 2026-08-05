import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    idempotencyRequest: { findUnique: vi.fn(), create: vi.fn() },
    paymentIpnLog: { create: vi.fn(), update: vi.fn() },
    paymentIntent: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
  settlement: { confirm: vi.fn() },
  paymentIntentPort: { registerMomo: vi.fn() },
  invoiceService: { getInvoice: vi.fn() },
  gateway: { createPayment: vi.fn(), queryTransaction: vi.fn(), handleIpn: vi.fn() },
  audit: vi.fn(),
}));

vi.mock('../src/core/prisma/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../src/core/ports/billingSettlementPort', () => ({
  billingSettlementPort: mocks.settlement,
}));
vi.mock('../src/core/ports/billingPaymentIntentPort', () => ({
  billingPaymentIntentPort: mocks.paymentIntentPort,
}));
vi.mock('../src/modules/invoices/services/invoice.service', () => ({
  invoiceService: mocks.invoiceService,
}));
vi.mock('../src/modules/payments/gateways/momo.sandbox.gateway', () => ({
  momoSandboxGateway: mocks.gateway,
}));
vi.mock('../src/core/ports/auditPort', () => ({ auditPort: { record: mocks.audit } }));

import { paymentService } from '../src/modules/payments/services/payment.service';

const pendingInvoice = {
  invoiceId: 'invoice-1',
  recordId: 'record-1',
  status: 'pending' as const,
  amountDue: '100000.00',
};

const settled = {
  invoiceId: 'invoice-1',
  paymentMethod: 'cash' as const,
  status: 'paid' as const,
  receiptNumber: 'RC-001',
  paidAt: '2026-08-05T10:00:00.000+07:00',
  amountDue: '100000.00',
  version: 2,
};

describe('PaymentService.settleCash', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('replays the cached idempotent response without settling twice', async () => {
    const cached = { responseJson: { invoiceId: 'invoice-1', status: 'paid' } };
    mocks.prisma.idempotencyRequest.findUnique.mockResolvedValue(cached);

    await expect(
      paymentService.settleCash({ invoiceId: 'invoice-1', idempotencyKey: 'key-1' }),
    ).resolves.toEqual(cached.responseJson);
    expect(mocks.settlement.confirm).not.toHaveBeenCalled();
    expect(mocks.prisma.idempotencyRequest.create).not.toHaveBeenCalled();
  });

  it('settles cash, persists the replay response and audits the receipt', async () => {
    mocks.prisma.idempotencyRequest.findUnique.mockResolvedValue(null);
    mocks.settlement.confirm.mockResolvedValue(settled);

    await expect(
      paymentService.settleCash({
        invoiceId: 'invoice-1',
        idempotencyKey: 'key-1',
        actorUserId: 'user-1',
      }),
    ).resolves.toMatchObject({ paymentMethod: 'cash', status: 'paid', receiptNumber: 'RC-001' });
    expect(mocks.prisma.idempotencyRequest.create).toHaveBeenCalledTimes(1);
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment.cash', resourceId: 'invoice-1' }),
    );
  });

  it('does not write idempotency or audit records when settlement fails', async () => {
    mocks.prisma.idempotencyRequest.findUnique.mockResolvedValue(null);
    mocks.settlement.confirm.mockRejectedValue(new Error('settlement failed'));

    await expect(
      paymentService.settleCash({ invoiceId: 'invoice-1', idempotencyKey: 'key-1' }),
    ).rejects.toThrow('settlement failed');
    expect(mocks.prisma.idempotencyRequest.create).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});

describe('PaymentService.createMomoRequest', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.invoiceService.getInvoice.mockResolvedValue(pendingInvoice);
    mocks.prisma.idempotencyRequest.findUnique.mockResolvedValue(null);
    mocks.gateway.createPayment.mockResolvedValue({
      payUrl: 'https://momo.test/pay/1',
      qrCodeUrl: 'EMV-PAYLOAD',
    });
    mocks.paymentIntentPort.registerMomo.mockResolvedValue({ status: 'pending' });
  });

  it('replays a cached Momo request without calling invoice or gateway', async () => {
    const cached = { responseJson: { invoiceId: 'invoice-1', status: 'pending' } };
    mocks.prisma.idempotencyRequest.findUnique.mockResolvedValue(cached);

    await expect(
      paymentService.createMomoRequest({ invoiceId: 'invoice-1', idempotencyKey: 'key-1' }),
    ).resolves.toEqual(cached.responseJson);
    expect(mocks.invoiceService.getInvoice).not.toHaveBeenCalled();
    expect(mocks.gateway.createPayment).not.toHaveBeenCalled();
  });

  it('rejects paid, cancelled and write-off invoices before gateway access', async () => {
    for (const status of ['paid', 'cancelled', 'write_off'] as const) {
      mocks.invoiceService.getInvoice.mockResolvedValueOnce({ ...pendingInvoice, status });

      await expect(
        paymentService.createMomoRequest({ invoiceId: 'invoice-1', idempotencyKey: `key-${status}` }),
      ).rejects.toMatchObject({ code: 'INVOICE_NOT_PENDING' });
    }
    expect(mocks.gateway.createPayment).not.toHaveBeenCalled();
  });

  it('maps gateway failure to a controlled 502 error', async () => {
    mocks.gateway.createPayment.mockRejectedValue(new Error('gateway unavailable'));

    await expect(
      paymentService.createMomoRequest({ invoiceId: 'invoice-1', idempotencyKey: 'key-1' }),
    ).rejects.toMatchObject({ statusCode: 502, code: 'MOMO_SANDBOX_UNAVAILABLE' });
    expect(mocks.paymentIntentPort.registerMomo).not.toHaveBeenCalled();
  });

  it('uses the QR payload when present and persists the payment intent', async () => {
    const result = await paymentService.createMomoRequest({
      invoiceId: 'invoice-1',
      idempotencyKey: 'key-1',
      actorUserId: 'user-1',
    });

    expect(result).toMatchObject({
      invoiceId: 'invoice-1',
      amount: '100000.00',
      payUrl: 'https://momo.test/pay/1',
      qrPayload: 'EMV-PAYLOAD',
      status: 'pending',
    });
    expect(mocks.paymentIntentPort.registerMomo).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceId: 'invoice-1', amount: '100000.00' }),
    );
    expect(mocks.prisma.idempotencyRequest.create).toHaveBeenCalledTimes(1);
  });

  it('falls back to payUrl when the gateway has no QR payload', async () => {
    mocks.gateway.createPayment.mockResolvedValueOnce({ payUrl: 'https://momo.test/pay/2', qrCodeUrl: null });

    await expect(
      paymentService.createMomoRequest({ invoiceId: 'invoice-1', idempotencyKey: 'key-2' }),
    ).resolves.toMatchObject({ qrPayload: 'https://momo.test/pay/2' });
  });
});

describe('PaymentService.handleMomoIpn', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects an invalid signature and records the rejection', async () => {
    mocks.gateway.handleIpn.mockReturnValue({ valid: false, message: 'bad signature' });

    await expect(paymentService.handleMomoIpn({ orderId: 'order-1' })).resolves.toMatchObject({
      processing: 'rejected',
      signatureValid: false,
      invoiceStatus: null,
    });
    expect(mocks.prisma.paymentIpnLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ processing: 'invalid_signature' }) }),
    );
  });

  it('keeps a valid failed transaction pending', async () => {
    mocks.gateway.handleIpn.mockReturnValue({
      valid: true,
      isSuccess: false,
      data: { orderId: 'order-1', transId: 'tx-1' },
    });

    await expect(paymentService.handleMomoIpn({ orderId: 'order-1', resultCode: 49 })).resolves.toMatchObject({
      processing: 'failed_keep_pending',
      invoiceStatus: 'pending',
    });
    expect(mocks.settlement.confirm).not.toHaveBeenCalled();
  });

  it('returns order_not_found for a valid success without a local intent', async () => {
    mocks.gateway.handleIpn.mockReturnValue({
      valid: true,
      isSuccess: true,
      data: { orderId: 'order-1', transId: 'tx-1' },
    });
    mocks.prisma.paymentIntent.findUnique.mockResolvedValue(null);

    await expect(paymentService.handleMomoIpn({ orderId: 'order-1', resultCode: 0 })).resolves.toMatchObject({
      processing: 'order_not_found',
      invoiceStatus: null,
    });
  });

  it('deduplicates a previously paid transaction', async () => {
    mocks.gateway.handleIpn.mockReturnValue({
      valid: true,
      isSuccess: true,
      data: { orderId: 'order-1', transId: 'tx-1' },
    });
    mocks.prisma.paymentIntent.findUnique.mockResolvedValue({ invoiceId: 'invoice-1' });
    mocks.prisma.paymentIntent.findFirst.mockResolvedValue({ invoiceId: 'invoice-1', status: 'paid' });
    mocks.invoiceService.getInvoice.mockResolvedValue({ ...pendingInvoice, status: 'paid' });

    await expect(paymentService.handleMomoIpn({ orderId: 'order-1', transId: 'tx-1' })).resolves.toMatchObject({
      processing: 'duplicate',
      invoiceStatus: 'paid',
    });
    expect(mocks.settlement.confirm).not.toHaveBeenCalled();
  });

  it('settles a valid success, updates intent and marks the IPN log settled', async () => {
    mocks.gateway.handleIpn.mockReturnValue({
      valid: true,
      isSuccess: true,
      data: { orderId: 'order-1', transId: 'tx-1', responseTime: 1_754_000_000_000 },
    });
    mocks.prisma.paymentIntent.findUnique.mockResolvedValue({
      id: 'intent-1',
      invoiceId: 'invoice-1',
      momoOrderId: 'order-1',
    });
    mocks.prisma.paymentIntent.findFirst.mockResolvedValue(null);
    mocks.settlement.confirm.mockResolvedValue({ ...settled, paymentMethod: 'momo' });

    await expect(paymentService.handleMomoIpn({ orderId: 'order-1', transId: 'tx-1' })).resolves.toMatchObject({
      processing: 'settled',
      invoiceStatus: 'paid',
    });
    expect(mocks.prisma.paymentIntent.update).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.paymentIpnLog.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { processing: 'settled' } }),
    );
  });
});

describe('PaymentService.syncMomoPayment', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(['paid', 'cancelled', 'write_off'] as const)(
    'does not query or settle a %s invoice',
    async (status) => {
      mocks.invoiceService.getInvoice.mockResolvedValue({ ...pendingInvoice, status });

      await paymentService.syncMomoPayment('invoice-1');

      expect(mocks.prisma.paymentIntent.findFirst).not.toHaveBeenCalled();
      expect(mocks.gateway.queryTransaction).not.toHaveBeenCalled();
    },
  );

  it('returns pending when no payment intent exists', async () => {
    mocks.invoiceService.getInvoice.mockResolvedValue(pendingInvoice);
    mocks.prisma.paymentIntent.findFirst.mockResolvedValue(null);

    await expect(paymentService.syncMomoPayment('invoice-1')).resolves.toMatchObject({
      invoiceId: 'invoice-1',
      status: 'pending',
    });
  });

  it('settles a successful gateway query and persists intent/IPN state', async () => {
    mocks.invoiceService.getInvoice.mockResolvedValue(pendingInvoice);
    mocks.prisma.paymentIntent.findFirst.mockResolvedValue({
      id: 'intent-1',
      invoiceId: 'invoice-1',
      momoOrderId: 'order-1',
      requestId: 'request-1',
    });
    mocks.gateway.queryTransaction.mockResolvedValue({ resultCode: 0, isSuccess: true, transId: 'tx-2' });
    mocks.settlement.confirm.mockResolvedValue({ ...settled, paymentMethod: 'momo' });
    mocks.invoiceService.getInvoice
      .mockResolvedValueOnce(pendingInvoice)
      .mockResolvedValueOnce({ ...pendingInvoice, status: 'paid', paymentMethod: 'momo' });

    await expect(paymentService.syncMomoPayment('invoice-1')).resolves.toMatchObject({ status: 'paid' });
    expect(mocks.settlement.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceId: 'invoice-1', method: 'momo', transId: 'tx-2' }),
    );
    expect(mocks.prisma.paymentIntent.update).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.paymentIpnLog.create).toHaveBeenCalledTimes(1);
  });
});
