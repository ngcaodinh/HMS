import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { config } from '../../../config/unifiedConfig';
import type { JwtPayload } from '../types/auth.types';

dayjs.extend(utc);
dayjs.extend(timezone);

export function signAccessToken(payload: JwtPayload): { accessToken: string; expiresAt: string } {
  const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  } as jwt.SignOptions);

  const decoded = jwt.decode(accessToken) as { exp: number };
  const expiresAt = dayjs.unix(decoded.exp).tz(config.app.timezone).format('YYYY-MM-DDTHH:mm:ssZ');

  return { accessToken, expiresAt };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
}
