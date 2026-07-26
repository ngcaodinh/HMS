import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export class AuditPort {
  static logActivity(action: string, actorId: string, resourceId: string, details?: any) {
    logger.info({ action, actorId, resourceId, details }, `[Audit] ${action}`);
  }

  static logError(error: Error, context: string) {
    logger.error({ err: error, context }, `[Audit Error] ${context}`);
  }
}
