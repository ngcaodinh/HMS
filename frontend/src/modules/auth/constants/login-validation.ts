/**
 * Quy tắc username phía client phải đồng bộ với `identitySchemas.ts` để chặn request sai sớm.
 * Đây chỉ là kiểm tra UX; backend vẫn là nơi xác thực cuối cùng và không được tin client.
 */
export const usernameFormatPattern = /^[A-Za-z0-9._]+$/;
export const usernameMinLength = 3;
export const usernameMaxLength = 50;

export type LoginFieldErrors = {
  password?: string;
  username?: string;
};

/**
 * Kiểm tra dữ liệu login đã được trim trước khi gửi BFF và trả lỗi theo từng field cho UI.
 * Đây là lớp UX; schema Identity ở backend vẫn là hàng rào xác thực cuối cùng.
 */
export const validateLoginCredentials = (username: string, password: string): LoginFieldErrors => {
  const fieldErrors: LoginFieldErrors = {};

  if (!username) {
    fieldErrors.username = 'Vui lòng nhập tên đăng nhập';
  } else if (username.length < usernameMinLength || username.length > usernameMaxLength) {
    fieldErrors.username = 'Tên đăng nhập phải có từ 3 đến 50 ký tự';
  } else if (!usernameFormatPattern.test(username)) {
    fieldErrors.username = 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm hoặc gạch dưới';
  }

  if (!password) fieldErrors.password = 'Vui lòng nhập mật khẩu';

  return fieldErrors;
};
