import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import {
  createPaymentAdvanceBodySchema,
  createRefundBodySchema,
  listPaymentAdvancesQuerySchema,
  recordIdParamSchema,
} from '../schemas/payment-advance.schemas';
import { paymentAdvanceService } from '../services/payment-advance.service';

/**
 * Controller HTTP cho giao dịch tạm ứng nội trú.
 */
export class PaymentAdvanceController {
  /**
   * @route POST /api/v1/medical-records/:recordId/payment-advances
   * @desc Tạo giao dịch thu tạm ứng nội trú.
   * @access Private (permission payment_advance.write)
   */
  async createDeposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordId } = recordIdParamSchema.parse(req.params);
      const body = createPaymentAdvanceBodySchema.parse(req.body);
      const data = await paymentAdvanceService.createDeposit({
        ...body,
        recordId,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/v1/medical-records/:recordId/payment-advances/refund
   * @desc Tạo giao dịch hoàn tạm ứng sau khi kiểm tra số dư.
   * @access Private (permission payment_advance.write)
   */
  async createRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordId } = recordIdParamSchema.parse(req.params);
      const body = createRefundBodySchema.parse(req.body);
      const data = await paymentAdvanceService.createRefund({
        ...body,
        method: 'cash',
        recordId,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/v1/medical-records/:recordId/payment-advances
   * @desc Lấy lịch sử thu/hoàn và số dư tạm ứng hiện tại.
   * @access Private (permission payment_advance.read)
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordId } = recordIdParamSchema.parse(req.params);
      const query = listPaymentAdvancesQuerySchema.parse(req.query);
      const data = await paymentAdvanceService.list({
        recordId,
        ...query,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentAdvanceController = new PaymentAdvanceController();
