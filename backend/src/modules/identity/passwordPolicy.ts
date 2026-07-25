import { randomInt } from 'node:crypto';

const symbols = '!@#$%';

/**
 * Sinh mật khẩu tạm thời đủ mạnh để bàn giao một lần khi tạo/reset tài khoản.
 */
export const generateTemporaryPassword = () => {
  const parts = [
    'Hms',
    String(randomInt(1000, 9999)),
    symbols[randomInt(0, symbols.length)],
    String.fromCharCode(65 + randomInt(0, 26)),
    String.fromCharCode(97 + randomInt(0, 26)),
  ];

  return parts.join('');
};
