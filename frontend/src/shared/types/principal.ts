import type { RoleCode } from '../auth/role-routing';

/** Mirrors backend `Principal` (`backend/src/modules/auth/types/auth.types.ts`). */
export interface Principal {
  userId: string;
  username: string;
  fullName: string;
  roleCodes: RoleCode[];
  departmentId: string;
  isActive: boolean;
}
