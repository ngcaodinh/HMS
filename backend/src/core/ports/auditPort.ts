import { logger } from '../logger/logger';

export type AuditRecordInput = {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

export interface AuditPort {
  record(input: AuditRecordInput): Promise<void>;
}

/**
 * Sprint 1 fake audit — không lưu PII thô.
 */
export class FakeAuditPort implements AuditPort {
  async record(input: AuditRecordInput): Promise<void> {
    logger.info(
      {
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        userId: input.userId,
        metadataKeys: input.metadata ? Object.keys(input.metadata) : [],
      },
      'audit.record',
    );
  }
}

export const auditPort: AuditPort = new FakeAuditPort();
