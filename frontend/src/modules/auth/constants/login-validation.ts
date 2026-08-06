/**
 * Quy tắc username dùng để phản hồi sớm trên form đăng nhập.
 *
 * @remarks
 * Các giới hạn này tính theo ký tự và phải đồng bộ với `identitySchemas.ts`, nhưng chỉ là lớp UX;
 * backend vẫn là hàng rào xác thực cuối cùng và không được tin dữ liệu từ client.
 */
export const usernameFormatPattern = /^[A-Za-z0-9._]+$/;
export const usernameMinLength = 3;
export const usernameMaxLength = 50;

/** Bản đồ lỗi hiển thị theo từng trường; không thay thế validate và authorize ở backend. */
export type LoginFieldErrors = {
  password?: string;
  username?: string;
};

/**
 * Kiểm tra thông tin đăng nhập đã được chuẩn hóa trước khi gửi BFF và trả lỗi theo từng trường.
 *
 * @param username - Username đã được trim; chỉ dùng cho phản hồi UX và không được xem là bằng
 * chứng xác thực.
 * @param password - Mật khẩu người dùng đang nhập; hàm không lưu hoặc ghi giá trị này.
 * @returns Bản đồ lỗi để form hiển thị; object rỗng khi không phát hiện lỗi phía client.
 * @remarks Backend vẫn là nơi kiểm tra hợp lệ và xác thực cuối cùng trước khi tạo session.
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
