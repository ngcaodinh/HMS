export interface Principal {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  roleCodes: string[];
  permissions: string[];
  departmentId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  authVersion: number;
}

export interface JwtPayload {
  userId: string;
  roleCodes: string[];
}
