import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  APP_TIMEZONE: z.string().default('Asia/Ho_Chi_Minh'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  UPLOAD_ROOT: z.string().default('./uploads'),
  MOMO_ENDPOINT: z.string().url().default('https://test-payment.momo.vn'),
  MOMO_PARTNER_CODE: z.string().default(''),
  MOMO_ACCESS_KEY: z.string().default(''),
  MOMO_SECRET_KEY: z.string().default(''),
  SENTRY_DSN: z.string().default(''),
});

const env = envSchema.parse(process.env);

export const config = {
  app: {
    env: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    timezone: env.APP_TIMEZONE,
  },
  database: {
    url: env.DATABASE_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  cors: {
    origins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
  },
  upload: {
    root: env.UPLOAD_ROOT,
  },
  momo: {
    endpoint: env.MOMO_ENDPOINT,
    partnerCode: env.MOMO_PARTNER_CODE,
    accessKey: env.MOMO_ACCESS_KEY,
    secretKey: env.MOMO_SECRET_KEY,
  },
  sentry: {
    dsn: env.SENTRY_DSN,
  },
} as const;
