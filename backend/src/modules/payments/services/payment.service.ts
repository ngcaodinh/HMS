import { randomUUID } from 'node:crypto';

import { AppError } from '../../../core/errors/appError';
import { auditPort } from '../../../core/ports/auditPort';
import { billingPaymentIntentPort } from '../../../core/ports/billingPaymentIntentPort';
import { billingSettlementPort } from '../../../core/ports/billingSettlementPort';
import { prisma } from '../../../core/prisma/prisma';
import {
  formatVietnamDbDateTime,
  getVietnamLegalDateString,
  getVietnamNowIso,
  toVietnamDbDateTime,
} from '../../../core/time/vietnamClock';
import { config } from '../../../config/unifiedConfig';
import { invoiceService } from '../../invoices/services/invoice.service';
import { toMoneyString, moneyStringToVndInteger } from '../../invoices/utils/money';
import { momoSandboxGateway } from '../gateways/momo.sandbox.gateway';
import type {
  CashPaymentResultDto,
  MomoPaymentRequestDto,
  PaymentStatusDto,
} from '../types/payment.types';

/**
 * Payment orchestration — cash + Momo (không Prisma-write invoice trực tiếp).
 */
export class PaymentService {
  /**
   * Thu tiền mặt.
   */
  async settleCash(input: {
    invoiceId: string;
    idempotencyKey: string;
    paidAt?: string;
    actorUserId?: string;
  }): Promise<CashPaymentResultDto> {
    const cached = await prisma.idempotencyRequest.findUnique({
      where: { key: input.idempotencyKey },
    });
    if (cached) {
      return cached.responseJson as unknown as CashPaymentResultDto;
    }

    const settled = await billingSettlementPort.confirm({
      invoiceId: input.invoiceId,
      method: 'cash',
      idempotencyKey: input.idempotencyKey,
      paidAt: input.paidAt,
      actorUserId: input.actorUserId,
    });

    const dto: CashPaymentResultDto = {
      invoiceId: settled.invoiceId,
      paymentMethod: 'cash',
      status: 'paid',
      receiptNumber: settled.receiptNumber,
      paidAt: settled.paidAt,
      recordClosure: settled.recordClosure,
    };

    await prisma.idempotencyRequest.create({
      data: {
        id: randomUUID(),
        key: input.idempotencyKey,
        route: 'POST /invoices/:id/cash-payments',
        statusCode: 201,
        responseJson: dto as object,
      },
    });

    await auditPort.record({
      action: 'payment.cash',
      resource: 'Invoice',
      resourceId: input.invoiceId,
      userId: input.actorUserId,
      metadata: { receiptNumber: settled.receiptNumber },
    });

    return dto;
  }

  /**
   * Tạo yêu cầu Momo Sandbox / mock.
   */
  async createMomoRequest(input: {
    invoiceId: string;
    idempotencyKey: string;
    returnUrl?: string;
    actorUserId?: string;
  }): Promise<MomoPaymentRequestDto> {
    const cached = await prisma.idempotencyRequest.findUnique({
      where: { key: input.idempotencyKey },
    });
    if (cached) {
      return cached.responseJson as unknown as MomoPaymentRequestDto;
    }

    const invoice = await invoiceService.getInvoice(input.invoiceId);
    if (invoice.status !== 'pending') {
      throw new AppError(400, 'INVOICE_NOT_PENDING', 'Hóa đơn không chờ thanh toán');
    }

    const dateStr = getVietnamLegalDateString().replace(/-/g, '');
    const shortId = input.invoiceId.replace(/-/g, '').slice(0, 8);
    // Suffix timestamp tránh trùng orderId Momo khi tạo lại
    const momoOrderId = `HMS-${dateStr}-${shortId}-${Date.now()}`;
    const requestId = `${config.momo.partnerCode || 'MOMO'}-${momoOrderId}`;
    const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000);
    const expiresAt = formatVietnamDbDateTime(toVietnamDbDateTime(expiresAtDate)) ?? getVietnamNowIso();

    // returnUrl mang invoiceId để FE resume sau sandbox
    const baseReturn = input.returnUrl ?? config.momo.returnUrl;
    const redirectUrl = baseReturn.includes('invoiceId=')
      ? baseReturn
      : `${baseReturn}${baseReturn.includes('?') ? '&' : '?'}invoiceId=${input.invoiceId}`;
    const ipnUrl = config.momo.ipnUrl;
    const amountInt = moneyStringToVndInteger(invoice.amountDue);

    const extraData = Buffer.from(
      JSON.stringify({ invoiceId: input.invoiceId, recordId: invoice.recordId }),
    ).toString('base64');

    let payUrl: string;
    let qrPayload: string;
    try {
      const momoResult = await momoSandboxGateway.createPayment({
        orderId: momoOrderId,
        amountVndInteger: amountInt,
        orderInfo: `Thanh toan vien phi HMS ${shortId}`,
        redirectUrl,
        ipnUrl,
        extraData,
        requestId,
      });
      payUrl = momoResult.payUrl;
      if (!payUrl) {
        throw new Error('Momo không trả payUrl');
      }
      // Ưu tiên qrCodeUrl từ Momo (payload gen QR). Fallback payUrl để FE vẫn vẽ QR được.
      qrPayload = momoResult.qrCodeUrl && momoResult.qrCodeUrl.length > 0
        ? momoResult.qrCodeUrl
        : payUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Momo unavailable';
      throw new AppError(502, 'MOMO_SANDBOX_UNAVAILABLE', message);
    }

    await billingPaymentIntentPort.registerMomo({
      invoiceId: input.invoiceId,
      momoOrderId,
      requestId,
      amount: invoice.amountDue,
      expiresAt,
      idempotencyKey: input.idempotencyKey,
      payUrl,
    });

    const dto: MomoPaymentRequestDto = {
      invoiceId: input.invoiceId,
      momoOrderId,
      requestId,
      amount: invoice.amountDue,
      payUrl,
      qrPayload,
      expiresAt,
      intentPersistence: config.momo.useMock ? 'mock_G9' : 'durable_G9',
      status: 'pending',
    };

    // Mock mode: auto-settle sau khi tạo (dev UX) — optional? Plan says poll/IPN.
    // Không auto-settle; FE poll hoặc gọi simulate IPN.

    await prisma.idempotencyRequest.create({
      data: {
        id: randomUUID(),
        key: input.idempotencyKey,
        route: 'POST /invoices/:id/momo-payment-requests',
        statusCode: 201,
        responseJson: dto as object,
      },
    });

    await auditPort.record({
      action: 'payment.momo.create',
      resource: 'Invoice',
      resourceId: input.invoiceId,
      userId: input.actorUserId,
      metadata: { momoOrderId },
    });

    return dto;
  }

  /**
   * Xử lý IPN Momo — luôn gọi sau khi log.
   */
  async handleMomoIpn(body: Record<string, unknown>): Promise<{
    received: boolean;
    momoOrderId: string | null;
    transId: string | null;
    signatureValid: boolean;
    processing: string;
    invoiceStatus: string | null;
    paidAt?: string | null;
  }> {
    const logId = randomUUID();
    const orderId = body.orderId !== undefined ? String(body.orderId) : null;
    const transId = body.transId !== undefined ? String(body.transId) : null;
    const resultCode =
      body.resultCode !== undefined && body.resultCode !== null
        ? Number(body.resultCode)
        : null;

    const parsed = momoSandboxGateway.handleIpn(body);

    await prisma.paymentIpnLog.create({
      data: {
        id: logId,
        orderId,
        transId,
        resultCode,
        signatureValid: parsed.valid,
        processing: parsed.valid
          ? parsed.isSuccess
            ? 'accepted_success'
            : 'accepted_failed'
          : 'invalid_signature',
        rawPayload: body as object,
      },
    });

    if (!parsed.valid || !parsed.data?.orderId) {
      return {
        received: true,
        momoOrderId: orderId,
        transId,
        signatureValid: false,
        processing: 'rejected',
        invoiceStatus: null,
      };
    }

    if (!parsed.isSuccess) {
      return {
        received: true,
        momoOrderId: parsed.data.orderId,
        transId: parsed.data.transId !== undefined ? String(parsed.data.transId) : null,
        signatureValid: true,
        processing: 'failed_keep_pending',
        invoiceStatus: 'pending',
      };
    }

    const intent = await prisma.paymentIntent.findUnique({
      where: { momoOrderId: parsed.data.orderId },
    });

    if (!intent) {
      return {
        received: true,
        momoOrderId: parsed.data.orderId,
        transId: parsed.data.transId !== undefined ? String(parsed.data.transId) : null,
        signatureValid: true,
        processing: 'order_not_found',
        invoiceStatus: null,
      };
    }

    // Dedupe by transId
    if (transId) {
      const prior = await prisma.paymentIntent.findFirst({
        where: { transId, status: 'paid' },
      });
      if (prior) {
        const inv = await invoiceService.getInvoice(prior.invoiceId);
        return {
          received: true,
          momoOrderId: parsed.data.orderId,
          transId,
          signatureValid: true,
          processing: 'duplicate',
          invoiceStatus: inv.status,
        };
      }
    }

    // responseTime Momo (ms epoch) → paidAt giao dịch; fallback now VN.
    let paidAtIso: string | undefined;
    const responseTime = parsed.data.responseTime;
    if (typeof responseTime === 'number' && responseTime > 0) {
      paidAtIso = new Date(responseTime).toISOString();
    } else if (typeof responseTime === 'string' && responseTime.length > 0) {
      const asNum = Number(responseTime);
      paidAtIso = Number.isFinite(asNum) && asNum > 1e11
        ? new Date(asNum).toISOString()
        : new Date(responseTime).toISOString();
    }

    const settled = await billingSettlementPort.confirm({
      invoiceId: intent.invoiceId,
      method: 'momo',
      momoOrderId: intent.momoOrderId,
      transId: transId ?? undefined,
      paidAt: paidAtIso,
    });

    const paidAtVn = toVietnamDbDateTime(
      paidAtIso ? new Date(paidAtIso) : new Date(),
    );
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: 'paid',
        transId: transId ?? undefined,
        paidAt: paidAtVn,
        updatedAt: paidAtVn,
      },
    });

    await prisma.paymentIpnLog.update({
      where: { id: logId },
      data: { processing: 'settled' },
    });

    return {
      received: true,
      momoOrderId: intent.momoOrderId,
      transId,
      signatureValid: true,
      processing: 'settled',
      invoiceStatus: settled.status,
      paidAt: settled.paidAt,
    };
  }

  async getPaymentStatus(invoiceId: string): Promise<PaymentStatusDto> {
    const invoice = await invoiceService.getInvoice(invoiceId);
    return {
      invoiceId: invoice.invoiceId,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod ?? null,
      momoOrderId: invoice.momoOrderId ?? null,
      paidAt: invoice.paidAt ?? null,
    };
  }

  /**
   * Sau return từ Momo: nếu chưa paid, query sandbox (hoặc mock) rồi settle.
   * Dùng khi IPN không vào được localhost.
   */
  async syncMomoPayment(invoiceId: string): Promise<PaymentStatusDto> {
    const invoice = await invoiceService.getInvoice(invoiceId);
    if (invoice.status === 'paid') {
      return this.getPaymentStatus(invoiceId);
    }
    if (invoice.status !== 'pending') {
      return this.getPaymentStatus(invoiceId);
    }

    const intent = await prisma.paymentIntent.findFirst({
      where: { invoiceId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (!intent) {
      return this.getPaymentStatus(invoiceId);
    }

    const query = await momoSandboxGateway.queryTransaction(
      intent.momoOrderId,
      intent.requestId,
    );

    // 0 = success, 9000 = authorized (1-step treat as paid on sandbox)
    const queryOk = query.isSuccess || query.resultCode === 9000;
    if (queryOk || config.momo.useMock) {
      const paidAtVn = toVietnamDbDateTime();
      await billingSettlementPort.confirm({
        invoiceId,
        method: 'momo',
        momoOrderId: intent.momoOrderId,
        transId:
          query.transId !== undefined ? String(query.transId) : `SYNC-${Date.now()}`,
        paidAt: new Date().toISOString(),
      });
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: 'paid',
          transId: query.transId !== undefined ? String(query.transId) : undefined,
          paidAt: paidAtVn,
          updatedAt: paidAtVn,
        },
      });
      await prisma.paymentIpnLog.create({
        data: {
          id: randomUUID(),
          orderId: intent.momoOrderId,
          transId: query.transId !== undefined ? String(query.transId) : null,
          resultCode: query.resultCode,
          signatureValid: true,
          processing: 'settled_via_query_sync',
          rawPayload: { source: 'momo-sync', ...query },
          createdAt: paidAtVn,
        },
      });
    }

    return this.getPaymentStatus(invoiceId);
  }
}

export const paymentService = new PaymentService();
