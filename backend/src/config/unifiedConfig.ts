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
  MOMO_ENDPOINT: z.string().default('https://test-payment.momo.vn'),
  MOMO_ENV: z.enum(['test', 'production']).default('test'),
  MOMO_PARTNER_CODE: z.string().default(''),
  MOMO_ACCESS_KEY: z.string().default(''),
  MOMO_SECRET_KEY: z.string().default(''),
  MOMO_PARTNER_NAME: z.string().default('HMS-VN'),
  MOMO_STORE_ID: z.string().default('HMS-Reception'),
  /**
   * payWithMethod = ví + ATM + Visa/MC…
   * captureWallet = chủ yếu ví MoMo / QR
   */
  MOMO_REQUEST_TYPE: z.string().default('payWithMethod'),
  MOMO_RETURN_URL: z
    .string()
    .default('http://localhost:3000/accounting?momo=return'),
  MOMO_IPN_URL: z.string().default('http://localhost:4000/api/v1/webhooks/momo'),
  USE_MOMO_MOCK: z
    .string()
    .optional()
    .transform((value) => value === 'true' || value === '1'),
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
    environment: env.MOMO_ENV,
    partnerCode: env.MOMO_PARTNER_CODE,
    accessKey: env.MOMO_ACCESS_KEY,
    secretKey: env.MOMO_SECRET_KEY,
    partnerName: env.MOMO_PARTNER_NAME,
    storeId: env.MOMO_STORE_ID,
    requestType: env.MOMO_REQUEST_TYPE,
    returnUrl: env.MOMO_RETURN_URL,
    ipnUrl: env.MOMO_IPN_URL,
    useMock: Boolean(env.USE_MOMO_MOCK) || env.NODE_ENV === 'test',
  },
  sentry: {
    dsn: env.SENTRY_DSN,
  },
} as const;
