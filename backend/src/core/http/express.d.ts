import type { Principal } from '../../modules/auth/types/auth.types';

declare global {
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

export {};
