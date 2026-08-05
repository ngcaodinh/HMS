import { useCallback, useEffect, useState } from 'react';

type AppToastTone = 'success' | 'error';

type AppToastState = {
  message: string | null;
  tone: AppToastTone;
};

/**
 * Quản lý trạng thái dùng chung cho popup thông báo `AppToast`: tự động ẩn sau một khoảng thời
 * gian, đồng thời cung cấp `hideToast` để nối vào prop `onClose` cho phép người dùng đóng sớm.
 * Tránh mỗi màn hình phải tự viết lại `useState` + `setTimeout` riêng.
 *
 * @param autoDismissMs Thời gian tự ẩn thông báo (mili-giây), mặc định 4000ms
 * @returns `toast` để render `<AppToast>`, `showToast` để hiển thị, `hideToast` để đóng thủ công
 */
export const useAppToast = (autoDismissMs = 4000) => {
  const [toast, setToast] = useState<AppToastState>({ message: null, tone: 'success' });

  const hideToast = useCallback(() => {
    setToast((current) => ({ ...current, message: null }));
  }, []);

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
