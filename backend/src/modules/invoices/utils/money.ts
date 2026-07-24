import { Prisma } from '@prisma/client';

const MONEY_REGEX = /^\d+(\.\d{2})$/;

/**
 * Format Prisma Decimal / number → money string contract `^\d+(\.\d{2})$`.
 */
export function toMoneyString(value: Prisma.Decimal | number | string): string {
  if (value instanceof Prisma.Decimal) {
    return value.toFixed(2);
  }
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) {
    throw new Error('INVALID_MONEY');
  }
  return num.toFixed(2);
}

/**
 * Parse money string → Prisma.Decimal.
 */
export function parseMoneyString(value: string): Prisma.Decimal {
  if (!MONEY_REGEX.test(value)) {
    throw new Error('INVALID_MONEY_FORMAT');
  }
  return new Prisma.Decimal(value);
}

/**
 * Convert money string VND → integer for Momo wire (no cents in VN practice for gateway).
 */
export function moneyStringToVndInteger(value: string): number {
  const decimal = parseMoneyString(value);
  return Math.floor(Number(decimal.toFixed(0)));
}

/**
 * Benefit level → rate decimal string 4 digits (vd. 0.8000).
 */
export function benefitLevelToRateString(
  level: 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100',
): string {
  switch (level) {
    case 'RATE_80':
      return '0.8000';
    case 'RATE_95':
      return '0.9500';
    case 'RATE_100':
      return '1.0000';
    default:
      return '0.0000';
  }
}
