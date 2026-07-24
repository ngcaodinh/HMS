export interface Principal {
  userId: string;
  username: string;
  fullName: string;
  roleCodes: string[];
  departmentId: string;
  isActive: boolean;
}

export interface JwtPayload {
  userId: string;
  roleCodes: string[];
}
