'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient, ApiError } from '@/shared/api-client';

type IconProps = {
  className?: string;
};

/**
 * Icon con mắt mở - hiển thị khi mật khẩu đang ở dạng ẩn (password)
 */
function EyeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

/**
 * Icon con mắt gạch chéo - hiển thị khi mật khẩu đang ở dạng xem văn bản (text)
 */
function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

/**
 * Icon ổ khóa trang trí phía trước ô input
 */
function LockIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M6.5 8V6.5a3.5 3.5 0 0 1 7 0V8m-8 0h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm4.5 3.25v1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/**
 * Icon tích xanh cho điều kiện mật khẩu hợp lệ
 */
function CheckIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/**
 * Form đổi mật khẩu bắt buộc với toggle xem mật khẩu (eye icon) và đánh giá độ mạnh mật khẩu.
 *
 * Input: Dữ liệu người dùng nhập (mật khẩu mới, xác nhận mật khẩu mới).
 * Output: Gọi API đổi mật khẩu và chuyển hướng về trang /login sau khi thành công.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý trạng thái xem/ẩn mật khẩu cho 2 trường
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Quản lý chuỗi mật khẩu mới và xác nhận mật khẩu để kiểm tra thời gian thực
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Các tiêu chí mật khẩu mạnh
  const hasMinLength = newPassword.length >= 10;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passedCriteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  // Trạng thái khớp mật khẩu
  const isConfirmTouched = confirmPassword.length > 0;
  const isPasswordMatch = newPassword.length > 0 && isConfirmTouched && newPassword === confirmPassword;

  /**
   * Đổi mật khẩu bắt buộc và chuyển về trang đăng nhập sau khi thành công.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (passedCriteriaCount < 5) {
      setError(
        'Mật khẩu phải đáp ứng đủ 5 điều kiện bảo mật (đủ 10 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt)',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient('/api/auth/password', {
        body: {
          newPassword,
        },
        method: 'PUT',
      });
      router.replace('/login');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể đổi mật khẩu, vui lòng thử lại',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Trả về nhãn và màu sắc cho thanh đo độ mạnh mật khẩu
   */
  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { color: 'bg-slate-200', text: '' };
    if (passedCriteriaCount <= 2) return { color: 'bg-red-500', text: 'Yếu' };
    if (passedCriteriaCount <= 4) return { color: 'bg-amber-500', text: 'Trung bình' };
    return { color: 'bg-emerald-500', text: 'Rất mạnh' };
  };

  const strengthInfo = getStrengthLabel();

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
      {/* Mật khẩu mới */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          htmlFor="newPassword"
        >
          Mật khẩu mới
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10"
            id="newPassword"
            name="newPassword"
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            required
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
          />
          <button
            aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            onClick={() => setShowNewPassword((prev) => !prev)}
            type="button"
          >
            {showNewPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Thanh hiển thị độ mạnh mật khẩu */}
        {newPassword.length > 0 ? (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Độ mạnh mật khẩu</span>
              <span className={`font-bold ${passedCriteriaCount === 5 ? 'text-emerald-600' : passedCriteriaCount >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                {strengthInfo.text}
              </span>
            </div>
            <div className="flex h-1.5 w-full gap-1 rounded-full bg-slate-100 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strengthInfo.color}`}
                style={{ width: `${(passedCriteriaCount / 5) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Danh sách tiêu chí bảo mật */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs space-y-1.5">
          <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
            Yêu cầu mật khẩu mạnh:
          </p>

          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-slate-600">
            <div className={`flex items-center gap-1.5 transition ${hasMinLength ? 'font-medium text-emerald-700' : 'text-slate-500'}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                {hasMinLength ? <CheckIcon className="h-3 w-3" /> : '•'}
              </span>
              <span>Tối thiểu 10 ký tự</span>
            </div>

            <div className={`flex items-center gap-1.5 transition ${hasUppercase && hasLowercase ? 'font-medium text-emerald-700' : 'text-slate-500'}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${hasUppercase && hasLowercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                {hasUppercase && hasLowercase ? <CheckIcon className="h-3 w-3" /> : '•'}
              </span>
              <span>Chữ hoa (A-Z) & thường (a-z)</span>
            </div>

            <div className={`flex items-center gap-1.5 transition ${hasNumber ? 'font-medium text-emerald-700' : 'text-slate-500'}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                {hasNumber ? <CheckIcon className="h-3 w-3" /> : '•'}
              </span>
              <span>Có ít nhất 1 chữ số (0-9)</span>
            </div>

            <div className={`flex items-center gap-1.5 transition ${hasSpecial ? 'font-medium text-emerald-700' : 'text-slate-500'}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${hasSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                {hasSpecial ? <CheckIcon className="h-3 w-3" /> : '•'}
              </span>
              <span>Ký tự đặc biệt (!@#$%...)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Xác nhận mật khẩu mới */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          htmlFor="confirmPassword"
        >
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoComplete="new-password"
            className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              isConfirmTouched && !isPasswordMatch
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-slate-200 focus:border-sky-600 focus:ring-sky-600/10'
            }`}
            id="confirmPassword"
            name="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
          />
          <button
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            type="button"
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Thông báo cảnh báo khi mật khẩu xác nhận không trùng khớp */}
        {isConfirmTouched && !isPasswordMatch ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-red-600">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Mật khẩu xác nhận chưa trùng khớp với mật khẩu mới</span>
          </div>
        ) : null}
      </div>

      {/* Thông báo lỗi */}
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : null}

      {/* Nút gửi */}
      <button
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004a75] via-[#006096] to-[#007abc] text-sm font-bold text-white shadow-md transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#006096]/20 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || passedCriteriaCount < 5 || !isPasswordMatch}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Đang xử lý...</span>
          </>
        ) : (
          'Đổi mật khẩu'
        )}
      </button>
    </form>
  );
}



