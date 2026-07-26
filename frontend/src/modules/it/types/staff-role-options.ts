import type { RoleCode } from './staff.schema';

export type RoleOption = {
  code: RoleCode;
  isDisabled: boolean;
  label: string;
  value: RoleCode;
};

type ItPrincipalRoleScope = {
  roleCodes: string[];
};

const privilegedRoleCodes = new Set<RoleCode>(['admin', 'it_tech', 'director']);

const staffRoleCatalog: Array<Omit<RoleOption, 'isDisabled'>> = [
  { code: 'admin', label: 'Quản trị viên (admin)', value: 'admin' },
  { code: 'director', label: 'Giám đốc (director)', value: 'director' },
  { code: 'doctor', label: 'Bác sĩ (doctor)', value: 'doctor' },
  { code: 'nurse', label: 'Điều dưỡng (nurse)', value: 'nurse' },
  { code: 'pharmacist', label: 'Dược sĩ (pharmacist)', value: 'pharmacist' },
  { code: 'accountant', label: 'Kế toán (accountant)', value: 'accountant' },
  { code: 'receptionist', label: 'Tiếp tân (receptionist)', value: 'receptionist' },
  { code: 'lab_tech', label: 'KTV xét nghiệm (lab_tech)', value: 'lab_tech' },
  { code: 'it_tech', label: 'KTV IT (it_tech)', value: 'it_tech' },
];

/**
 * Trả catalog role cho form IT và khóa role đặc quyền khi actor không phải admin.
 * Nhận role principal hiện tại, trả đủ role để UI hiển thị nhưng chỉ role hợp lệ mới được submit.
 */
export const getManageableRoleOptions = (principal: ItPrincipalRoleScope): RoleOption[] => {
  const isAdmin = principal.roleCodes.includes('admin');

  return staffRoleCatalog.map((option) => ({
    ...option,
    isDisabled: !isAdmin && privilegedRoleCodes.has(option.code),
  }));
};

/**
 * Kiểm tra role đã chọn có nằm trong phạm vi actor được gán từ UI hay không.
 */
export const canAssignRoleCode = (
  roleOptions: RoleOption[],
  roleCode: RoleCode,
): boolean =>
  roleOptions.some((option) => option.value === roleCode && !option.isDisabled);
