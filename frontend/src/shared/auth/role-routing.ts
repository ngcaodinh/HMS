/** Role code canonical dùng cho route routing; không phải danh sách permission backend. */
export type RoleCode =
  | 'admin'
  | 'it_tech'
  | 'director'
  | 'receptionist'
  | 'accountant'
  | 'doctor'
  | 'nurse'
  | 'lab_tech'
  | 'pharmacist';

type RoleHomeRule = {
  homePath: string;
  roleCodes: RoleCode[];
};

type StaffPathRule = {
  pathPrefixes: string[];
  roleCodes: RoleCode[];
};

/** Danh sách trang mặc định; rule đứng trước có độ ưu tiên khi principal có nhiều role. */
const roleHomeRules: RoleHomeRule[] = [
  { homePath: '/admin', roleCodes: ['admin'] },
  { homePath: '/it-technician', roleCodes: ['it_tech'] },
  { homePath: '/director/dashboard', roleCodes: ['director'] },
  { homePath: '/reception', roleCodes: ['receptionist'] },
  { homePath: '/accounting', roleCodes: ['accountant'] },
  { homePath: '/doctor', roleCodes: ['doctor'] },
  { homePath: '/nurse', roleCodes: ['nurse'] },
  { homePath: '/lab-technician', roleCodes: ['lab_tech'] },
  { homePath: '/pharmacy', roleCodes: ['pharmacist'] },
];

/** Ánh xạ route staff với role được phép qua lớp guard giao diện/middleware. */
const staffPathRules: StaffPathRule[] = [
  { pathPrefixes: ['/admin'], roleCodes: ['admin'] },
  { pathPrefixes: ['/it-technician'], roleCodes: ['admin', 'it_tech'] },
  { pathPrefixes: ['/director'], roleCodes: ['director'] },
  { pathPrefixes: ['/reception'], roleCodes: ['receptionist'] },
  { pathPrefixes: ['/accounting'], roleCodes: ['accountant'] },
  { pathPrefixes: ['/doctor'], roleCodes: ['doctor'] },
  { pathPrefixes: ['/nurse'], roleCodes: ['nurse'] },
  { pathPrefixes: ['/lab-technician'], roleCodes: ['lab_tech'] },
  { pathPrefixes: ['/lab'], roleCodes: ['lab_tech', 'admin'] },
  { pathPrefixes: ['/pharmacy'], roleCodes: ['pharmacist'] },
];

/** Route public không yêu cầu middleware kiểm tra session; `/` là match chính xác. */
const publicPathPrefixes = ['/', '/login', '/kiosk', '/queue-display'];

/** Tập role được công nhận; role lạ từ API sẽ bị loại khỏi routing. */
const supportedRoleCodes = new Set<RoleCode>(roleHomeRules.flatMap((rule) => rule.roleCodes));

// Chuẩn hóa slash đầu và bỏ một slash cuối ở path dài hơn root trước khi so rule.
const normalizePathname = (pathname: string) => {
  if (!pathname.startsWith('/')) return `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
};

// So khớp theo boundary để `/lab` không vô tình khớp `/laboratory`.
const matchesPathPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * Lọc role code từ dữ liệu runtime về các giá trị mà frontend có rule routing.
 * @param roleCodes Dữ liệu role chưa được kiểm chứng từ principal/API.
 * @returns Mảng role hợp lệ, hoặc mảng rỗng khi input không phải array hay không có role được
 * hỗ trợ.
 * @remarks Đây chỉ là chuẩn hóa cho điều hướng/visibility; backend vẫn là nơi quyết định quyền.
 */
export const normalizeRoleCodes = (roleCodes: unknown): RoleCode[] => {
  if (!Array.isArray(roleCodes)) return [];

  return roleCodes.filter(
    (roleCode): roleCode is RoleCode =>
      typeof roleCode === 'string' && supportedRoleCodes.has(roleCode as RoleCode),
  );
};

/**
 * Trả URL mặc định theo role với thứ tự rule ổn định, không phụ thuộc thứ tự role từ API.
 * @returns Home path của role đầu tiên khớp hoặc `null` nếu không có rule.
 */
export const resolveRoleHomePath = (roleCodes: readonly string[]): string | null => {
  const roleCodeSet = new Set(roleCodes);
  const matchedRule = roleHomeRules.find((rule) =>
    rule.roleCodes.some((roleCode) => roleCodeSet.has(roleCode)),
  );

  return matchedRule?.homePath ?? null;
};

/**
 * Xác định pathname có thuộc nhóm public không cần session/role routing hay không.
 * @returns `true` cho route public, trong đó `/` chỉ khớp chính xác.
 */
export const isPublicPath = (pathname: string): boolean => {
  const normalizedPathname = normalizePathname(pathname);

  return publicPathPrefixes.some((prefix) =>
    prefix === '/' ? normalizedPathname === '/' : matchesPathPrefix(normalizedPathname, prefix),
  );
};

/**
 * Xác định pathname có thuộc màn hình nhân viên cần middleware kiểm tra session/role hay không.
 * @remarks Kết quả chỉ chọn guard cần chạy, không tự cấp quyền gọi API backend.
 */
export const isStaffPath = (pathname: string): boolean => {
  const normalizedPathname = normalizePathname(pathname);

  return staffPathRules.some((rule) =>
    rule.pathPrefixes.some((prefix) => matchesPathPrefix(normalizedPathname, prefix)),
  );
};

/**
 * Kiểm tra role hiện tại có khớp rule của URL staff hay không.
 * @returns `false` cho route không có rule hoặc role không khớp.
 * @remarks Đây là UI/middleware route guard; backend authorization vẫn phải kiểm tra độc lập.
 */
export const canAccessStaffPath = (pathname: string, roleCodes: readonly string[]): boolean => {
  const normalizedPathname = normalizePathname(pathname);
  const matchedRule = staffPathRules.find((rule) =>
    rule.pathPrefixes.some((prefix) => matchesPathPrefix(normalizedPathname, prefix)),
  );

  if (!matchedRule) return false;

  return matchedRule.roleCodes.some((roleCode) => roleCodes.includes(roleCode));
};
