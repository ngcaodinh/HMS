import type { ReferenceRange } from '../types/lab-test.types';

/** Chọn dòng trị số tham chiếu phù hợp nhất cho 1 field: ưu tiên dòng theo đúng giới tính bệnh
 * nhân, rơi về dòng `condition: 'all'` nếu không có dòng riêng theo giới. */
export function findReferenceRangeHint(
  ranges: ReferenceRange[],
  fieldKey: string,
  patientGender?: 'male' | 'female',
): string | undefined {
  const candidates = ranges.filter((range) => range.fieldKey === fieldKey);
  const matched =
    candidates.find((range) => range.condition === patientGender) ?? candidates.find((range) => range.condition === 'all');
  if (!matched) return undefined;

  const { lowerBound, upperBound, unit } = matched;
  const unitSuffix = unit ? ` ${unit}` : '';
  if (lowerBound && upperBound) return `${lowerBound}–${upperBound}${unitSuffix}`;
  if (lowerBound) return `≥ ${lowerBound}${unitSuffix}`;
  if (upperBound) return `≤ ${upperBound}${unitSuffix}`;
  return undefined;
}
