/** Mirrors backend `Principal` (`backend/src/modules/auth/types/auth.types.ts`). */
export interface Principal {
  userId: string;
  username: string;
  fullName: string;
  roleCodes: string[];
  departmentId: string;
  isActive: boolean;
}

export const ROLE_HOME_PATH: Record<string, string> = {
  doctor: '/doctor',
  lab_tech: '/lab-technician',
  pharmacist: '/pharmacy',
  receptionist: '/reception',
  nurse: '/nurse',
  accountant: '/accounting',
};

export function resolveRoleHomePath(roleCodes: string[]): string {
  for (const role of roleCodes) {
    const path = ROLE_HOME_PATH[role];
    if (path) return path;
  }
  return '/';
}
