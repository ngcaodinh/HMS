import { AppError } from '../../core/http/AppError';
import type { Principal, RoleCode } from './identityTypes';

/**
 * Các vai trò đặc quyền không được IT technician tự tạo, sửa hoặc khóa.
 */
export const privilegedRoleCodes = new Set<RoleCode>(['admin', 'it_tech', 'director']);

/**
 * Nhóm vai trò nhân viên vận hành mà IT technician được quản lý trực tiếp.
 */
export const staffManagedByItRoleCodes = roleCodesWithoutPrivileged();

function roleCodesWithoutPrivileged(): RoleCode[] {
  return ['receptionist', 'accountant', 'doctor', 'nurse', 'lab_tech', 'pharmacist'];
}

/**
 * Chặn actor thao tác lên role ngoài phạm vi được phép theo RBAC.
 */
export const assertCanManageTargetRoles = (actor: Principal, targetRoleCodes: RoleCode[]) => {
  if (actor.roleCodes.includes('admin')) return;

  if (actor.roleCodes.includes('it_tech')) {
    const hasPrivilegedRole = targetRoleCodes.some((roleCode) => privilegedRoleCodes.has(roleCode));

    if (!hasPrivilegedRole) return;
  }

  throw new AppError({
    code: 'TARGET_ROLE_FORBIDDEN',
    message: 'Không đủ quyền quản lý vai trò nhân viên này',
    status: 403,
  });
};

/**
 * Bắt buộc IT technician nhập mã yêu cầu hỗ trợ cho thao tác nhạy cảm.
 */
export const assertSupportReference = (actor: Principal, reference: string | undefined) => {
  if (!actor.roleCodes.includes('it_tech')) return;

  if (reference && reference.trim().length >= 3 && reference.trim().length <= 100) return;

  throw new AppError({
    code: 'SUPPORT_REFERENCE_REQUIRED',
    message: 'Kỹ thuật IT phải nhập mã yêu cầu hỗ trợ',
    status: 422,
  });
};
