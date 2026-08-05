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

export type HealthInsuranceLineInput = {
  amount: Prisma.Decimal;
  coveredByHealthInsurance: boolean;
  ceilingPrice: Prisma.Decimal | null;
};

export type HealthInsuranceLineResult = {
  coveredByHealthInsurance: boolean;
  healthInsuranceBenefitRateSnapshot: string | null;
  healthInsuranceEligibleAmount: Prisma.Decimal;
  healthInsuranceCeilingAmount: Prisma.Decimal;
  healthInsuranceFundAmount: Prisma.Decimal;
  patientCoPayAmount: Prisma.Decimal;
};

export type HealthInsuranceCalculation = {
  lines: HealthInsuranceLineResult[];
  healthInsuranceBaseAmount: Prisma.Decimal;
  healthInsuranceDiscountAmount: Prisma.Decimal;
  totalPatientAmount: Prisma.Decimal;
};

/** Tính BHYT từng dòng bằng Decimal; mọi tỷ lệ và số tiền đều do server xác định. */
export function calculateHealthInsurance(
  benefitLevel: 'NO_COVERAGE' | 'RATE_80' | 'RATE_95' | 'RATE_100',
  lines: HealthInsuranceLineInput[],
): HealthInsuranceCalculation {
  const zero = new Prisma.Decimal(0);
  const rateString = benefitLevelToRateString(benefitLevel);
  const rate = new Prisma.Decimal(rateString);
  let healthInsuranceBaseAmount = zero;
  let healthInsuranceDiscountAmount = zero;
  let totalPatientAmount = zero;
  const results = lines.map((line) => {
    const amount = line.amount.toDecimalPlaces(2);
    if (amount.lt(zero)) {
      throw new Error('INVALID_MONEY_AMOUNT');
    }
    const isCovered = benefitLevel !== 'NO_COVERAGE' && line.coveredByHealthInsurance;
    const ceiling = line.ceilingPrice && line.ceilingPrice.gt(zero)
      ? line.ceilingPrice.toDecimalPlaces(2)
      : amount;
    const eligible = isCovered ? (ceiling.lt(amount) ? ceiling : amount) : zero;
    const fund = isCovered ? eligible.mul(rate).toDecimalPlaces(2) : zero;
    const copay = amount.sub(fund).toDecimalPlaces(2);
    healthInsuranceBaseAmount = healthInsuranceBaseAmount.add(eligible);
    healthInsuranceDiscountAmount = healthInsuranceDiscountAmount.add(fund);
    totalPatientAmount = totalPatientAmount.add(copay);
    return {
      coveredByHealthInsurance: isCovered,
      healthInsuranceBenefitRateSnapshot: isCovered ? rateString : null,
      healthInsuranceEligibleAmount: eligible,
      healthInsuranceCeilingAmount: isCovered ? ceiling : zero,
      healthInsuranceFundAmount: fund,
      patientCoPayAmount: copay,
    };
  });
  return {
    lines: results,
    healthInsuranceBaseAmount: healthInsuranceBaseAmount.toDecimalPlaces(2),
    healthInsuranceDiscountAmount: healthInsuranceDiscountAmount.toDecimalPlaces(2),
    totalPatientAmount: totalPatientAmount.toDecimalPlaces(2),
  };
}
