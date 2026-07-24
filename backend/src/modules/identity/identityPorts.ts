import { AppError } from '../../core/http/AppError';
import { logger } from '../../core/logger/logger';
import type { AuditPort, DepartmentDirectoryPort } from './identityTypes';

const developmentDepartments = new Set([
  'clinical',
  'dermatology',
  'laboratory',
  'pharmacy',
  'accounting',
  'reception',
  'it',
]);

export const departmentDirectoryPort: DepartmentDirectoryPort = {
  async assertDepartmentExists(departmentId) {
    if (developmentDepartments.has(departmentId)) return;

    throw new AppError({
      code: 'DEPARTMENT_NOT_FOUND',
      message: 'Khoa/phòng không tồn tại trong danh mục phát triển',
      status: 422,
    });
  },
};

export const auditPort: AuditPort = {
  async record(input) {
    logger.info(
      {
        action: input.action,
        actorId: input.actorId,
        changedFields: input.changedFields,
        reference: input.reference,
        requestId: input.requestId,
        resource: input.resource,
        resourceId: input.resourceId,
      },
      'Identity audit event',
    );
  },
};
