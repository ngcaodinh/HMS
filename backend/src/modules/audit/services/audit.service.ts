import { insertAuditLog } from '../repositories/audit.repository';
import type { RecordAuditInput } from '../types/audit.types';

/**
 * AuditPort.record() — append-only audit trail used by every sign/dispense/override/deny
 * action across modules (CLAUDE.md §6.4, Gate G1/G13 in the task breakdown).
 * @param {RecordAuditInput} input Redacted actor/action/resource context to persist.
 * @returns {Promise<void>}
 */
export async function recordAuditLog(input: RecordAuditInput): Promise<void> {
  await insertAuditLog(input);
}
