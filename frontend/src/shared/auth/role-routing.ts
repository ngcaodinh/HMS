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

const publicPathPrefixes = ['/', '/login', '/kiosk', '/queue-display'];

const supportedRoleCodes = new Set<RoleCode>(roleHomeRules.flatMap((rule) => rule.roleCodes));

const normalizePathname = (pathname: string) => {
  if (!pathname.startsWith('/')) return `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
};

const matchesPathPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Chuẩn hóa role từ dữ liệu không tin cậy để chỉ giữ các role HMS đã hỗ trợ routing.
export const normalizeRoleCodes = (roleCodes: unknown): RoleCode[] => {
  if (!Array.isArray(roleCodes)) return [];

  return roleCodes.filter(
    (roleCode): roleCode is RoleCode =>
      typeof roleCode === 'string' && supportedRoleCodes.has(roleCode as RoleCode),
  );
};

// Trả URL mặc định theo role với thứ tự ưu tiên ổn định, không phụ thuộc thứ tự role từ API.
export const resolveRoleHomePath = (roleCodes: readonly string[]): string | null => {
  const roleCodeSet = new Set(roleCodes);
  const matchedRule = roleHomeRules.find((rule) =>
    rule.roleCodes.some((roleCode) => roleCodeSet.has(roleCode)),
  );

  return matchedRule?.homePath ?? null;
};

// Nhận pathname thật của Next.js và cho biết route có nằm trong nhóm public không cần auth hay không.
export const isPublicPath = (pathname: string): boolean => {
  const normalizedPathname = normalizePathname(pathname);

  return publicPathPrefixes.some((prefix) =>
    prefix === '/' ? normalizedPathname === '/' : matchesPathPrefix(normalizedPathname, prefix),
  );
};

// Xác định URL có thuộc nhóm màn hình nhân viên cần kiểm tra session/role hay không.
export const isStaffPath = (pathname: string): boolean => {
  const normalizedPathname = normalizePathname(pathname);

  return staffPathRules.some((rule) =>
    rule.pathPrefixes.some((prefix) => matchesPathPrefix(normalizedPathname, prefix)),
  );
};

// Kiểm tra principal đã đăng nhập có được mở URL staff theo role hay không.
export const canAccessStaffPath = (pathname: string, roleCodes: readonly string[]): boolean => {
  const normalizedPathname = normalizePathname(pathname);
  const matchedRule = staffPathRules.find((rule) =>
    rule.pathPrefixes.some((prefix) => matchesPathPrefix(normalizedPathname, prefix)),
  );

  if (!matchedRule) return false;

  return matchedRule.roleCodes.some((roleCode) => roleCodes.includes(roleCode));
};
