import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import {
  cancelInvoiceBodySchema,
  createInvoiceBodySchema,
  invoiceIdParamSchema,
  listInvoicesQuerySchema,
} from '../schemas/invoice.schemas';
import { invoiceService } from '../services/invoice.service';

/**
 * Controllers HTTP Invoice — /api/v1.
 */
export class InvoiceController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createInvoiceBodySchema.parse(req.body);
      const data = await invoiceService.createInvoice({
        ...body,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const data = await invoiceService.getInvoice(invoiceId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listInvoicesQuerySchema.parse(req.query);
      const result = await invoiceService.listInvoices(query);
      res.status(200).json({
        data: result.data,
        pagination: result.pagination,
        meta: { requestId: req.requestId },
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const body = cancelInvoiceBodySchema.parse(req.body);
      const data = await invoiceService.cancelInvoice({
        invoiceId,
        expectedVersion: body.expectedVersion,
        cancelReason: body.cancelReason,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
