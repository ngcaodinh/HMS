/**
 * Feature flag: bật API billing thật (BE).
 * Mặc định true (trừ khi set NEXT_PUBLIC_USE_REAL_BILLING=false).
 */
export const USE_REAL_BILLING =
  process.env.NEXT_PUBLIC_USE_REAL_BILLING !== 'false' &&
  process.env.NEXT_PUBLIC_USE_REAL_BILLING !== '0';

/**
 * recordId seed billing — cập nhật nếu seed in ra UUID khác.
 * seed-billing-dev cố gắng dùng cccccccc-cccc-4ccc-8ccc-cccccccccccc.
 */
export const DEV_BILLING_RECORD_ID =
  process.env.NEXT_PUBLIC_BILLING_RECORD_ID ??
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
