import type { Principal } from '../../modules/auth/types/auth.types';

declare global {
  type LegacyRequestUser = {
    id: string;
    username: string;
    role: string;
    roleCodes: string[];
    permissions: string[];
    departmentId?: string;
  };

  namespace Express {
    interface Request {
      principal?: Principal;
      requestId: string;
      user?: LegacyRequestUser;
    }
  }
}

export {};
