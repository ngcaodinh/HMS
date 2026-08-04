import { AppError } from '../../../core/errors/app-error';

/**
 * Kiểm tra khoảng ngày báo cáo biến động kho trước khi đi vào lớp validate/schema.
 *
 * @param from Giá trị query bắt đầu nhận từ Express.
 * @param to Giá trị query kết thúc nhận từ Express.
 * @returns AppError có mã nghiệp vụ riêng khi khoảng ngày đảo chiều; ngược lại trả `null`.
 */
export function getInvalidStockMovementDateRangeError(
  from: unknown,
  to: unknown,
): AppError | null {
  if (typeof from !== 'string' || typeof to !== 'string') return null;

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate <= toDate) {
    return null;
  }

  return AppError.badRequest(
    'INVALID_DATE_RANGE',
    'Khoảng thời gian không hợp lệ (từ ngày phải trước hoặc bằng đến ngày).',
    [{ field: 'from', rule: 'from must be before or equal to to' }],
  );
}
