const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

type VietnamDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

/**
 * Lấy các thành phần lịch/giờ theo Asia/Ho_Chi_Minh.
 */
export function getVietnamDateTimeParts(reference: Date = new Date()): VietnamDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(reference);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
    // en-CA không có fractional second; giữ ms thực của reference cho độ mịn.
    millisecond: reference.getMilliseconds(),
  };
}

/**
 * MySQL DATETIME (không timezone) + Prisma: ghi tường đồng hồ Việt Nam
 * để Workbench/DB hiển thị đúng giờ thực tế khi bấm lấy số.
 *
 * Prisma serialize Date theo UTC components → ta encode wall-clock VN vào UTC fields.
 */
export function toVietnamDbDateTime(reference: Date = new Date()): Date {
  const parts = getVietnamDateTimeParts(reference);
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ),
  );
}

/**
 * Đọc DATETIME đã lưu theo wall-clock VN → ISO-8601 +07:00.
 * Không convert timezone lần 2 (tránh +7 thành +14).
 */
export function formatVietnamDbDateTime(date: Date | null | undefined): string | null {
  if (!date) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  const millisecond = String(date.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}+07:00`;
}

/**
 * Trả Date “ngày lịch” VN dùng cho Prisma @db.Date.
 */
export function getVietnamLegalDate(reference: Date = new Date()): Date {
  const parts = getVietnamDateTimeParts(reference);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

/**
 * Chuỗi YYYY-MM-DD theo legal clock Việt Nam.
 */
export function getVietnamLegalDateString(reference: Date = new Date()): string {
  const parts = getVietnamDateTimeParts(reference);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD → Date UTC midnight cho cột DATE.
 */
export function parseLegalDateString(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new Error('INVALID_DATE');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * ISO-8601 với offset +07:00 (từ instant thật → wall-clock VN).
 * Dùng cho meta.occurredAt; timestamp DB queue dùng formatVietnamDbDateTime.
 */
export function getVietnamNowIso(reference: Date = new Date()): string {
  const parts = getVietnamDateTimeParts(reference);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  const hour = String(parts.hour).padStart(2, '0');
  const minute = String(parts.minute).padStart(2, '0');
  const second = String(parts.second).padStart(2, '0');

  return `${parts.year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
}

/**
 * Format Date absolute → ISO +07:00 (convert timezone).
 * @deprecated Ưu tiên formatVietnamDbDateTime cho cột queue DATETIME đã lưu wall-clock VN.
 */
export function toVietnamIso(date: Date | null | undefined): string | null {
  if (!date) {
    return null;
  }

  return getVietnamNowIso(date);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
