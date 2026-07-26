/**
 * Kết thúc phiên BFF và chuyển người dùng về màn đăng nhập.
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
