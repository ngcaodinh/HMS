import type { Request } from 'express';

export const roleCodes = [
  'admin',
  'receptionist',
  'accountant',
  'doctor',
  'nurse',
  'lab_tech',
  'pharmacist',
  'it_tech',
  'director',
] as const;

export type RoleCode = (typeof roleCodes)[number];
export type Gender = 'male' | 'female';

export type StaffUserRecord = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
  phoneNumber: string;
  identityCardNumber: string;
  departmentId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  authVersion: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roleCodes: RoleCode[];
};

export type PublicStaffUser = Omit<StaffUserRecord, 'password'>;

export type Principal = PublicStaffUser;

export type AuthenticatedRequest = Request & {
  principal?: Principal;
};

export type CreateStaffData = {
  username: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: Date;
  phoneNumber: string;
  identityCardNumber: string;
  departmentId: string;
  roleCodes: RoleCode[];
};

export type UpdateStaffData = Partial<
  Pick<CreateStaffData, 'departmentId' | 'fullName' | 'phoneNumber' | 'roleCodes'> & {
    isActive: boolean;
  }
>;

export type IdentityRepository = {
  countActiveAdminsExcluding(userId: string): Promise<number>;
  createStaffUser(input: {
    assignedBy: string;
    data: CreateStaffData;
    passwordHash: string;
  }): Promise<StaffUserRecord>;
  findRoleCodesForUser(userId: string): Promise<RoleCode[]>;
  findUserById(userId: string): Promise<StaffUserRecord | null>;
  findUserByUsername(username: string): Promise<StaffUserRecord | null>;
  listStaffUsers(input: {
    page: number;
    pageSize: number;
    q?: string;
  }): Promise<{ items: StaffUserRecord[]; totalItems: number }>;
  replaceUserRoles(input: {
    assignedBy: string;
    roleCodes: RoleCode[];
    userId: string;
  }): Promise<void>;
  updateLastLogin(userId: string, occurredAt: Date): Promise<void>;
  updatePassword(input: {
    mustChangePassword: boolean;
    passwordHash: string;
    userId: string;
  }): Promise<StaffUserRecord | null>;
  updateStaffUser(input: {
    data: Partial<
      Omit<UpdateStaffData, 'roleCodes'> & {
        authVersion?: { increment: number };
      }
    >;
    userId: string;
  }): Promise<StaffUserRecord | null>;
  userHasAction(userId: string, actionCode: string): Promise<boolean>;
};

export type DepartmentDirectoryPort = {
  assertDepartmentExists(departmentId: string): Promise<void>;
};

export type AuditPort = {
  record(input: {
    action: string;
    actorId: string;
    changedFields?: string[];
    reference?: string;
    requestId: string;
    resource: string;
    resourceId?: string;
  }): Promise<void>;
};

export type BcryptPort = {
  compare(plainText: string, hash: string): Promise<boolean>;
  hash(plainText: string): Promise<string>;
};

export type JwtPort = {
  sign(payload: { authVersion: number; userId: string }): string;
  verify(token: string): { authVersion: number; userId: string };
};
