import { AppError } from '../../core/http/app-error';
import { prisma } from '../../core/database/prisma-client';
import { logger } from '../../core/logger/logger';
import type { AuditPort, DepartmentDirectoryPort } from './identity-types';

const developmentDepartments = {
  accounting: { name: 'Phòng Kế toán', type: 'administrative' },
  clinical: { name: 'Khoa Khám bệnh', type: 'clinical' },
  dermatology: { name: 'Khoa Da liễu', type: 'clinical' },
  it: { name: 'Phòng Công nghệ thông tin', type: 'administrative' },
  laboratory: { name: 'Khoa Xét nghiệm', type: 'paraclinical' },
  pharmacy: { name: 'Khoa Dược', type: 'administrative' },
  reception: { name: 'Quầy Tiếp nhận', type: 'administrative' },
} as const;

/**
 * Port danh mục khoa/phòng tạm thời cho Lane 1 trước khi có module danh mục riêng.
 * Nhận id hoặc mã phòng ban từ API, trả id thật để thỏa ràng buộc FK của bảng users.
 */
export const departmentDirectoryPort: DepartmentDirectoryPort = {
  async resolveDepartmentId(departmentId) {
    const departmentById = await prisma.department.findFirst({
      select: {
        id: true,
      },
      where: {
        id: departmentId,
        isActive: true,
      },
    });

    if (departmentById) return departmentById.id;

    const departmentByCode = await prisma.department.findFirst({
      select: {
        id: true,
      },
      where: {
        code: departmentId,
        isActive: true,
      },
    });

    if (departmentByCode) return departmentByCode.id;

    const developmentDepartment =
      developmentDepartments[departmentId as keyof typeof developmentDepartments];

    if (developmentDepartment) {
      const department = await prisma.department.upsert({
        create: {
          code: departmentId,
          id: departmentId,
          isActive: true,
          name: developmentDepartment.name,
          type: developmentDepartment.type,
        },
        select: {
          id: true,
        },
        update: {
          isActive: true,
          name: developmentDepartment.name,
          type: developmentDepartment.type,
        },
        where: {
          id: departmentId,
        },
      });

      return department.id;
    }

    throw new AppError({
      code: 'DEPARTMENT_NOT_FOUND',
      details: [{ field: 'departmentId', message: 'Khoa/phòng không tồn tại', rule: 'exists' }],
      message: 'Khoa/phòng không tồn tại trong danh mục',
      status: 422,
    });
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
