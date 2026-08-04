import { beforeAll, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';

import type { JwtPort } from '../../src/modules/identity/identityTypes';

let jwtPort: JwtPort;

describe('jwtPort', () => {
  beforeAll(async () => {
    // Cấu hình môi trường trực tiếp giúp test adapter độc lập với file .env của máy developer.
    process.env.DATABASE_URL ??= 'mysql://test:test@localhost:3306/hms_test';
    process.env.JWT_SECRET ??= 'test-secret-for-jwt-port';
    process.env.JWT_EXPIRES_IN ??= '8h';
    process.env.JWT_REMEMBER_EXPIRES_IN ??= '30d';
    process.env.JWT_ISSUER ??= 'hms-vn-test';
    process.env.JWT_AUDIENCE ??= 'hms-vn-staff-test';

    ({ jwtPort } = await import('../../src/modules/identity/jwtPort'));
  });

  it('signs a default-expiry token and returns an ISO expiration', () => {
    const result = jwtPort.sign({
      authVersion: 1,
      userId: '11111111-1111-4111-8111-111111111111',
    });

    expect(result.token).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(result.expiresAt))).toBe(false);
    expect(jwtPort.verify(result.token)).toEqual({
      authVersion: 1,
      userId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('honors the remember-session expiry override', () => {
    const normalSession = jwtPort.sign({ authVersion: 1, userId: 'normal' });
    const rememberedSession = jwtPort.sign(
      { authVersion: 1, userId: 'remembered' },
      { expiresIn: '30d' },
    );

    expect(Date.parse(rememberedSession.expiresAt)).toBeGreaterThan(
      Date.parse(normalSession.expiresAt),
    );
  });

  it('rejects invalid or structurally incomplete tokens with a safe error', () => {
    expect(() => jwtPort.verify('not-a-jwt')).toThrowError(
      expect.objectContaining({ code: 'INVALID_TOKEN', status: 401 }),
    );

    const incompleteToken = jwt.sign({ authVersion: 1 }, process.env.JWT_SECRET as string, {
      audience: process.env.JWT_AUDIENCE,
      expiresIn: '8h',
      issuer: process.env.JWT_ISSUER,
    });

    expect(() => jwtPort.verify(incompleteToken)).toThrowError(
      expect.objectContaining({ code: 'INVALID_TOKEN', status: 401 }),
    );
  });
});
