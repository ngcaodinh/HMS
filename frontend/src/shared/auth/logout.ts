/**
 * Gọi `POST /api/auth/logout` để BFF kết thúc phiên rồi chuyển người dùng về `/login`.
 * @remarks Điều hướng nằm trong `finally`, nên request lỗi vẫn dẫn người dùng về màn đăng nhập;
 * hàm không retry và không hiển thị lỗi riêng.
 */
export const performLogout = async () => {
  try {
    await fetch('/api/auth/logout', {
      cache: 'no-store',
      credentials: 'include',
      method: 'POST',
    });
  } finally {
    window.location.assign('/login');
  }
};
