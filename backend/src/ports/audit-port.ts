import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export class AuditPort {
  /** Ghi audit event tối thiểu, không đưa dữ liệu nhạy cảm thô vào log. */
  static logActivity(
    action: string,
    actorId: string,
    resourceId: string,
    details?: Record<string, unknown>,
  ): void {
    logger.info({ action, actorId, resourceId, details }, `[Audit] ${action}`);
  }

  /** Ghi lỗi audit kèm context để có thể truy vết mà không làm lộ payload. */
  static logError(error: Error, context: string): void {
    logger.error({ err: error, context }, `[Audit Error] ${context}`);
  }
}
