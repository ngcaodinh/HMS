import { z } from 'zod';

import { getVietnamLegalDateString } from '../../../core/time/vietnamClock';

const MIN_PATIENT_DATE_OF_BIRTH = '1900-01-01';

/**
 * Kiểm tra ngày sinh theo ngày lịch Việt Nam, bao gồm ngày tồn tại thực tế,
 * giới hạn tuổi hợp lý và không cho phép ngày ở tương lai.
 */
export const patientDateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải theo định dạng YYYY-MM-DD')
  .superRefine((value, ctx) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    const isRealDate =
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day;

    if (!isRealDate || value < MIN_PATIENT_DATE_OF_BIRTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ngày sinh không hợp lệ',
      });
      return;
    }

    if (value > getVietnamLegalDateString()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ngày sinh không được ở tương lai',
      });
    }
  });
