import bcrypt from 'bcryptjs';

import type { BcryptPort } from './identityTypes';

const SALT_ROUNDS = 12;

export const bcryptPort: BcryptPort = {
  compare: (plainText, hash) => bcrypt.compare(plainText, hash),
  hash: (plainText) => bcrypt.hash(plainText, SALT_ROUNDS),
};
