import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/appError';
import { sendSuccess } from '../../../core/http/response';
import {
  cashPaymentBodySchema,
  idempotencyKeySchema,
  invoiceIdParamSchema,
  momoPaymentRequestBodySchema,
} from '../schemas/payment.schemas';
import { paymentService } from '../services/payment.service';

/**
 * Controllers Payment — cash / momo / status.
 */
export class PaymentController {
  async cashPay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const rawKey = req.header('idempotency-key');
      const keyParsed = idempotencyKeySchema.safeParse(rawKey);
      if (!keyParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Header Idempotency-Key (UUID) là bắt buộc', [
          { field: 'Idempotency-Key', rule: 'uuid' },
        ]);
      }
      const body = cashPaymentBodySchema.parse(req.body ?? {});
      const data = await paymentService.settleCash({
        invoiceId,
        idempotencyKey: keyParsed.data,
        paidAt: body.paidAt,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async createMomo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const rawKey = req.header('idempotency-key');
      const keyParsed = idempotencyKeySchema.safeParse(rawKey);
      if (!keyParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Header Idempotency-Key (UUID) là bắt buộc', [
          { field: 'Idempotency-Key', rule: 'uuid' },
        ]);
      }
      const body = momoPaymentRequestBodySchema.parse(req.body ?? {});
      const data = await paymentService.createMomoRequest({
        invoiceId,
        idempotencyKey: keyParsed.data,
        returnUrl: body.returnUrl,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async paymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const data = await paymentService.getPaymentStatus(invoiceId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đồng bộ trạng thái sau return URL Momo (query gateway nếu IPN chưa về).
   */
  async syncMomo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const data = await paymentService.syncMomoPayment(invoiceId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * IPN Momo — public, always HTTP 200 vendor body after receive.
   */
  async momoWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      await paymentService.handleMomoIpn(body);
      // Vendor-compatible (doc-momo): không bọc Shared Contract
      res.status(200).json({ resultCode: 0, message: 'Received' });
    } catch {
      res.status(200).json({ resultCode: 0, message: 'Received' });
    }
  }
}

export const paymentController = new PaymentController();
