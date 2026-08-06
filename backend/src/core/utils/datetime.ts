import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { config } from '../../config/unified-config';

dayjs.extend(utc);
dayjs.extend(timezone);

export function toVNISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = dayjs(date);
  if (!d.isValid()) return null;
  return d.tz(config.app.timezone).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
}
