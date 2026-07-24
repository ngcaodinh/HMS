export const PAYMENT_PERMISSIONS = {
  CASH_CREATE: 'payment.cash.create',
  MOMO_CREATE: 'payment.momo.create',
  READ: 'payment.read',
  ADVANCE_WRITE: 'payment_advance.write',
} as const;

export const MOMO_REQUEST_TYPE = 'payWithMethod';

export const PAYMENT_METHOD = {
  CASH: 'cash',
  MOMO: 'momo',
} as const;
