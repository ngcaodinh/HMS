import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../core/errors/appError';
import { sendSuccess } from '../../../core/http/response';
import {
  callNextBodySchema,
  idempotencyKeySchema,
  listQueueTicketsQuerySchema,
  publicDisplayQuerySchema,
  recallBodySchema,
  skipBodySchema,
  ticketIdParamSchema,
} from '../schemas/queue.schemas';
import { queueService } from '../services/queue.service';

/**
 * Controllers HTTP Queue — contract /api/v1.
 */
export class QueueController {
  async issueTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawKey = req.header('idempotency-key');
      const parsed = idempotencyKeySchema.safeParse(rawKey);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Header Idempotency-Key (UUID) là bắt buộc', [
          { field: 'Idempotency-Key', rule: 'uuid' },
        ]);
      }

      const data = await queueService.issueTicket({ idempotencyKey: parsed.data });
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async reprintTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = ticketIdParamSchema.parse(req.params);
      const data = await queueService.reprintTicket(ticketId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async getPublicDisplay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = publicDisplayQuerySchema.parse(req.query);
      const data = await queueService.getPublicDisplay(query.date);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listQueueTicketsQuerySchema.parse(req.query);
      const result = await queueService.listTickets({
        date: query.date,
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
      });

      res.status(200).json({
        data: result.data,
        pagination: result.pagination,
        meta: {
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async callNext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = callNextBodySchema.parse(req.body ?? {});
      const data = await queueService.callNext(body.date, req.principal?.userId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async skipTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = ticketIdParamSchema.parse(req.params);
      const body = skipBodySchema.parse(req.body ?? {});
      const data = await queueService.skipTicket(ticketId, body.reason, req.principal?.userId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async recallTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = ticketIdParamSchema.parse(req.params);
      const body = recallBodySchema.parse(req.body ?? {});
      const data = await queueService.recallTicket(ticketId, body.reason, req.principal?.userId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/v1/queue-tickets/:ticketId/reannounce
   * @desc  Gọi lại số đang called (re-announce)
   * @access Private (queue.call)
   */
  async reannounceTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = ticketIdParamSchema.parse(req.params);
      const data = await queueService.reannounceTicket(ticketId, req.principal?.userId);
      sendSuccess(res, data, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }

  async issueDeskTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawKey = req.header('idempotency-key');
      const parsed = idempotencyKeySchema.safeParse(rawKey);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Header Idempotency-Key (UUID) là bắt buộc', [
          { field: 'Idempotency-Key', rule: 'uuid' },
        ]);
      }

      const data = await queueService.issueDeskTicket(parsed.data);
      sendSuccess(res, data, 201, req.requestId);
    } catch (error) {
      next(error);
    }
  }
}

export const queueController = new QueueController();
