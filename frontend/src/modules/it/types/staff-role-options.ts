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

type RoleOptionScope = {
  mode?: 'create' | 'manage';
};

/** Role bị IT thường hạn chế; admin vẫn có thể thao tác theo policy backend. */
const privilegedRoleCodes = new Set<RoleCode>(['admin', 'it_tech', 'director']);
/** Role nhạy cảm bị khóa trên form tạo khi actor không phải admin. */
const privilegedCreationRoleCodes = new Set<RoleCode>(['admin', 'it_tech']);

/** Catalog nhãn role dùng chung cho bộ lọc và form quản lý staff. */
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
 * Trả catalog role cho form IT theo ngữ cảnh tạo/sửa và khóa role ngoài phạm vi actor.
 * Nhận role principal hiện tại, trả đủ role để UI hiển thị và đánh dấu role bị hạn chế.
 *
 * @remarks Đây chỉ là permission gate ở UI; backend vẫn kiểm tra authorization và audit khi submit.
 * Chế độ `create` khóa thêm role `director` với actor không phải admin theo workflow hiện tại.
 */
export const getManageableRoleOptions = (
  principal: ItPrincipalRoleScope,
  scope: RoleOptionScope = {},
): RoleOption[] => {
  const isAdmin = principal.roleCodes.includes('admin');
  const disabledRoleCodes =
    scope.mode === 'create' ? privilegedCreationRoleCodes : privilegedRoleCodes;

  return staffRoleCatalog.map((option) => ({
    ...option,
    isDisabled: !isAdmin && disabledRoleCodes.has(option.code),
  }));
};

/**
 * Kiểm tra role đã chọn có nằm trong phạm vi actor được gán từ UI hay không.
 *
 * @returns `false` khi role không có trong catalog hoặc đang bị đánh dấu disabled; kết quả này chỉ
 * dùng để chặn sớm ở form, không thay thế authorization backend.
 */
export const canAssignRoleCode = (
  roleOptions: RoleOption[],
  roleCode: RoleCode,
): boolean =>
  roleOptions.some((option) => option.value === roleCode && !option.isDisabled);
