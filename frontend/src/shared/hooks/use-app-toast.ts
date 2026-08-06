import { useCallback, useEffect, useState } from 'react';

/** Sắc thái UI được ánh xạ sang vai trò trợ năng của `AppToast`. */
type AppToastTone = 'success' | 'error';

/** Trạng thái local của thông báo; `message: null` biểu thị không hiển thị. */
type AppToastState = {
  message: string | null;
  tone: AppToastTone;
};

/**
 * Quản lý trạng thái dùng chung cho popup thông báo `AppToast`: tự động ẩn sau một khoảng thời
 * gian, đồng thời cung cấp `hideToast` để nối vào prop `onClose` cho phép người dùng đóng sớm.
 * Tránh mỗi màn hình phải tự viết lại `useState` + `setTimeout` riêng.
 *
 * @param autoDismissMs Thời gian tự ẩn tính bằng mili-giây, mặc định 4000ms.
 * @returns `toast` để render `<AppToast>`, cùng `showToast` và `hideToast`.
 * @remarks Hook chỉ sở hữu UI state, không có server state, retry hoặc cache. Timer được hủy khi
 * message/thời lượng thay đổi hoặc component unmount để tránh auto-dismiss nhầm thông báo mới.
 */
export const useAppToast = (autoDismissMs = 4000) => {
  const [toast, setToast] = useState<AppToastState>({ message: null, tone: 'success' });

  const hideToast = useCallback(() => {
    setToast((current) => ({ ...current, message: null }));
  }, []);

  // Đồng bộ timer với message và thời lượng; cleanup xóa timer cũ trước lần đăng ký kế tiếp.
  useEffect(() => {
    if (!toast.message) return undefined;

    const timer = window.setTimeout(hideToast, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [toast.message, autoDismissMs, hideToast]);

  const showToast = useCallback((message: string, tone: AppToastTone = 'success') => {
    setToast({ message, tone });
  }, []);

  return { hideToast, showToast, toast };
};
