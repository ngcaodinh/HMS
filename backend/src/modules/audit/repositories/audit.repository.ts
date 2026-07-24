import { randomUUID } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../../core/db/prisma-client';
import type { RecordAuditInput } from '../types/audit.types';

export async function insertAuditLog(input: RecordAuditInput): Promise<void> {
  await prisma.audit_logs.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      userRole: input.userRole,
      userName: input.userName,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
