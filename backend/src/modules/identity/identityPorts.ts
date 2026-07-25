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

/**
 * Port danh mục khoa/phòng tạm thời cho Lane 1 trước khi có module danh mục riêng.
 */
export const departmentDirectoryPort: DepartmentDirectoryPort = {
  assertDepartmentExists(departmentId) {
    if (developmentDepartments.has(departmentId)) return Promise.resolve();

    return Promise.reject(new AppError({
      code: 'DEPARTMENT_NOT_FOUND',
      message: 'Khoa/phòng không tồn tại trong danh mục phát triển',
      status: 422,
    }));
  },
};

/**
 * Port audit hiện ghi log có cấu trúc; có thể thay bằng audit store ở sprint sau.
 */
export const auditPort: AuditPort = {
  record(input) {
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
    return Promise.resolve();
  },
};
