import { ANTIBIOGRAM_FIELDS, type MicrobiologyResult } from '../types/lab-test.types';

const OTHER_ANTIBIOGRAM_RESULT_FIELDS = ['ksdKhacKqA', 'ksdKhacKqB', 'ksdKhacKqC'] as const;

/** Đảm bảo kết quả kháng sinh đồ luôn đi kèm chủng vi khuẩn để tránh hồ sơ thiếu ngữ cảnh. */
export function getMicrobiologyFieldErrors(value: MicrobiologyResult): Record<string, string> {
  const hasAntibiogramResult = [...ANTIBIOGRAM_FIELDS, ...OTHER_ANTIBIOGRAM_RESULT_FIELDS].some(
    (field) => Boolean(value[field]),
  );

  if (hasAntibiogramResult && !value.chungVkKsd?.trim()) {
    return { chungVkKsd: 'Cần nhập chủng vi khuẩn khi đã có kết quả kháng sinh đồ.' };
  }

  return {};
}
