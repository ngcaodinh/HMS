import bcrypt from 'bcryptjs';

import type { BcryptPort } from './identity-types';

const SALT_ROUNDS = 12;

/**
 * Adapter bcrypt dùng chung cho hash/compare để service dễ mock khi test.
 */
export const bcryptPort: BcryptPort = {
  compare: (plainText, hash) => bcrypt.compare(plainText, hash),
  hash: (plainText) => bcrypt.hash(plainText, SALT_ROUNDS),
};
