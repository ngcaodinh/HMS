import { AppError } from '../../core/http/AppError';
import type { Principal, RoleCode } from './identityTypes';

/**
 * Các vai trò đặc quyền bị ẩn khỏi phạm vi quản lý trực tiếp của IT technician.
 */
export const privilegedRoleCodes = new Set<RoleCode>(['admin', 'it_tech', 'director']);

/**
 * Nhóm vai trò nhân viên vận hành mà IT technician được quản lý trực tiếp.
 */
export const staffManagedByItRoleCodes = roleCodesWithoutPrivileged();

/**
 * Phạm vi tạo tài khoản của IT technician có thêm director theo yêu cầu vận hành.
 */
const staffCreatableByItRoleCodes = new Set<RoleCode>([
  ...staffManagedByItRoleCodes,
  'director',
]);

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
 * Cho phép IT technician tạo director nhưng không mở quyền sửa/reset role đặc quyền.
 */
export const assertCanCreateTargetRoles = (actor: Principal, targetRoleCodes: RoleCode[]) => {
  if (actor.roleCodes.includes('admin')) return;

  if (actor.roleCodes.includes('it_tech')) {
    const canCreateAllTargetRoles = targetRoleCodes.every((roleCode) =>
      staffCreatableByItRoleCodes.has(roleCode),
    );

    if (canCreateAllTargetRoles) return;
  }

  throw new AppError({
    code: 'TARGET_ROLE_FORBIDDEN',
    message: 'Không đủ quyền quản lý vai trò nhân viên này',
    status: 403,
  });
};
