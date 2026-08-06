import { ApiError } from '@/shared/api-client';

/** Thông báo hiển thị an toàn; không chứa chi tiết xác thực hoặc lỗi nội bộ backend. */
export const lockedAccountMessage =
  'Tài khoản đã bị khóa. Vui lòng liên hệ kĩ thuật viên IT để xử lý!';

export const loginFailedMessage = 'Tên đăng nhập hoặc mật khẩu không đúng!';

const genericLoginErrorMessage = 'Không thể đăng nhập, vui lòng thử lại!';
const rateLimitedLoginMessage = 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.';

/**
 * Ánh xạ lỗi đăng nhập đã chuẩn hóa thành thông báo an toàn cho người dùng.
 *
 * @param caught - Lỗi từ fetch boundary; chỉ `ApiError` có status và code được ánh xạ chi tiết.
 * @returns Thông báo không làm lộ chi tiết xác thực hoặc dữ liệu nhạy cảm.
 * @remarks
 * - `USER_INACTIVE`/403 hiển thị trạng thái tài khoản bị khóa.
 * - `LOGIN_RATE_LIMITED`/429 dùng thông báo giới hạn thử lại; countdown được `LoginForm` đọc
 *   từ `retryAfterSeconds` của `ApiError`.
 * - 400/401 dùng cùng một thông báo để không phân biệt username với mật khẩu sai.
 * - Lỗi không nhận diện được dùng fallback chung; backend vẫn quyết định quyền tạo session.
 */
export const getLoginErrorMessage = (caught: unknown) => {
  if (!(caught instanceof ApiError)) return genericLoginErrorMessage;

  if (caught.code === 'USER_INACTIVE' && caught.status === 403) {
    return lockedAccountMessage;
  }

  if (caught.code === 'LOGIN_RATE_LIMITED' && caught.status === 429) {
    return rateLimitedLoginMessage;
  }

  if ([400, 401].includes(caught.status)) {
    return loginFailedMessage;
  }

  return genericLoginErrorMessage;
};
