import type { audit_logs_action } from '@prisma/client';

export type AuditAction = audit_logs_action;

export interface RecordAuditInput {
  userId: string | null;
  userRole: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  /** Redacted context only — never pass raw password/JWT/CCCD/MED text here. */
  metadata?: Record<string, unknown>;
}
