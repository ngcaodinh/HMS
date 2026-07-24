export const INVOICE_PERMISSIONS = {
  CREATE: 'invoice.create',
  READ: 'invoice.read',
  CANCEL: 'invoice.cancel',
  WRITE_OFF: 'invoice.write_off',
  STATEMENT_SIGN: 'statement.sign',
} as const;

export const HI_RULE_SOURCE_DRAFT =
  'NĐ 188/2025/NĐ-CP; TT 12/2026/TT-BTC (DRAFT_G8 — fixture Sprint 1)';

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  WRITE_OFF: 'write_off',
} as const;
