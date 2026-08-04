import { ApiError } from '@/shared/api-client';

export const lockedAccountMessage =
  'Tài khoản đã bị khóa. Vui lòng liên hệ kĩ thuật viên IT để xử lý!';

export const loginFailedMessage = 'Tên đăng nhập hoặc mật khẩu không đúng!';

const genericLoginErrorMessage = 'Không thể đăng nhập, vui lòng thử lại!';
const rateLimitedLoginMessage =
  'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.';

/**
 * Chọn thông báo lỗi đăng nhập an toàn dựa trên mã lỗi API đã chuẩn hóa.
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
