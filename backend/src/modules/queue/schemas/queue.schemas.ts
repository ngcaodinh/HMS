import { z } from 'zod';

export const idempotencyKeySchema = z.string().uuid();

export const listQueueTicketsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['waiting', 'called', 'served', 'skipped']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const callNextBodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const skipBodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export const recallBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export const publicDisplayQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const ticketIdParamSchema = z.object({
  ticketId: z.string().uuid(),
});

export const socketIssuePayloadSchema = z.object({
  idempotencyKey: z.string().uuid(),
});
