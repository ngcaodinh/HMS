import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../core/http/response';
import {
  cancelInvoiceBodySchema,
  accountingReportQuerySchema,
  createInvoiceBodySchema,
  invoiceIdParamSchema,
  listInvoiceCandidatesQuerySchema,
  listInvoicesQuerySchema,
  writeOffInvoiceBodySchema,
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

  /**
   * @route GET /api/v1/accounting-reports
   * @desc Tổng hợp giao dịch thu phí, BHYT, tạm ứng và hoàn ứng theo ngày.
   * @access Private (permission invoice.read)
   */
  async accountingReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = accountingReportQuerySchema.parse(req.query);
      const data = await invoiceService.getAccountingReport(query);
      sendSuccess(res, data, 200, req.requestId);
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

  /**
   * @route GET /api/v1/invoice-candidates
   * @desc Lấy hồ sơ có dịch vụ chưa lập hóa đơn pending.
   * @access Private (permission invoice.read)
   */
  async listCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listInvoiceCandidatesQuerySchema.parse(req.query);
      const result = await invoiceService.listInvoiceCandidates(query);
      res.status(200).json({
        data: result.data,
        pagination: result.pagination,
        meta: { requestId: req.requestId },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ghi nhận miễn giảm thất thu cho hóa đơn cấp cứu sau khi kiểm tra điều kiện nghiệp vụ.
   * @route POST /api/v1/invoices/:invoiceId/write-off
   * @desc Ghi nhận write-off hóa đơn cấp cứu và tạo bản ghi phê duyệt.
   * @access Private - yêu cầu permission invoice.write_off.
   */
  async writeOff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);
      const body = writeOffInvoiceBodySchema.parse(req.body);
      const data = await invoiceService.writeOffInvoice({
        invoiceId,
        expectedVersion: body.expectedVersion,
        writeOffReason: body.writeOffReason,
        actorUserId: req.principal?.userId,
      });
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
