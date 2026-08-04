'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  usernameFormatPattern,
  usernameMaxLength,
  usernameMinLength,
} from '@/modules/auth/constants/login-validation';
import { LoginSuccessOverlay } from '@/modules/auth/components/login-success-overlay';
import { getLoginErrorMessage } from '@/modules/auth/utils/login-error';
import { apiClient, ApiError } from '@/shared/api-client';

type IconProps = {
  className?: string;
};

type LoginResponse = {
  homePath: string | null;
  principal: {
    fullName: string;
    mustChangePassword: boolean;
    roleCodes: string[];
  };
};

type LoginFieldErrors = {
  password?: string;
  username?: string;
};

type LoginFormProps = {
  initialReason?: string;
};

const rememberedUsernameStorageKey = 'hms.rememberedUsername';

/** Lưu hoặc xóa username đã nhớ; tuyệt đối không lưu password hay token vào localStorage. */
const persistRememberedUsername = (username: string, shouldRemember: boolean) => {
  if (shouldRemember) {
    window.localStorage.setItem(rememberedUsernameStorageKey, username);
    return;
  }

  window.localStorage.removeItem(rememberedUsernameStorageKey);
};

function UserIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

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

function EyeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M2.5 10s2.75-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.75 4.5-7.5 4.5S2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HeadsetIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M4 11V9a6 6 0 0 1 12 0v2M4 11h2v4H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm10 0h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v-4Zm0 4c0 1.1-.9 2-2 2h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function LoginForm({ initialReason }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [remember, setRemember] = useState(false);
  const [username, setUsername] = useState('');
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [successState, setSuccessState] = useState<{
    fullName: string;
    mustChangePassword: boolean;
    nextPath: string;
  } | null>(null);

  useEffect(() => {
    const storedUsername = window.localStorage.getItem(rememberedUsernameStorageKey);
    if (!storedUsername) return;

    setUsername(storedUsername);
    setRemember(true);
  }, []);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setRetryAfterSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (!successState) return undefined;

    const timer = window.setTimeout(() => router.replace(successState.nextPath), 900);

    return () => window.clearTimeout(timer);
  }, [router, successState]);

  /**
   * Xử lý gửi form đăng nhập qua BFF.
   * Kiểm tra đầu vào, chặn gửi trùng, truyền lựa chọn remember và lưu username sau khi thành công.
   *
   * @param event - Sự kiện submit form đăng nhập của người dùng
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || retryAfterSeconds > 0) return;

    setError('');
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const nextFieldErrors: LoginFieldErrors = {};

    if (!username) {
      nextFieldErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (
      username.length < usernameMinLength ||
      username.length > usernameMaxLength ||
      !usernameFormatPattern.test(username)
    ) {
      nextFieldErrors.username = 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm hoặc gạch dưới';
    }

    if (!password) {
      nextFieldErrors.password = 'Vui lòng nhập mật khẩu';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiClient<LoginResponse>('/api/auth/login', {
        body: {
          password,
          remember,
          username,
        },
        method: 'POST',
      });

      if (result.principal.mustChangePassword) {
        setSuccessState({
          fullName: result.principal.fullName,
          mustChangePassword: true,
          nextPath: '/change-password',
        });
        persistRememberedUsername(username, remember);
        return;
      }

      if (result.homePath) {
        setSuccessState({
          fullName: result.principal.fullName,
          mustChangePassword: false,
          nextPath: result.homePath,
        });
        persistRememberedUsername(username, remember);
        return;
      }

      setError('Tài khoản chưa được cấu hình trang làm việc phù hợp');
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        setRetryAfterSeconds(caught.retryAfterSeconds ?? 0);
      }
      setError(getLoginErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block pl-1 text-[11px] font-bold uppercase leading-4 text-[#3f4851]"
            htmlFor="username"
          >
            Tên đăng nhập
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]" />
            <input
              aria-describedby={fieldErrors.username ? 'username-error' : undefined}
              aria-invalid={Boolean(fieldErrors.username)}
              autoComplete="username"
              autoFocus
              className={`h-12 w-full rounded-xl border bg-white px-12 text-sm text-[#171c1f] outline-none transition placeholder:text-[#bfc7d2] focus:ring-4 ${
                fieldErrors.username
                  ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
                  : 'border-[#bfc7d2] focus:border-[#006096] focus:ring-[#006096]/10'
              }`}
              id="username"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Mã nhân viên hoặc tên đăng nhập"
              required
              type="text"
              value={username}
            />
          </div>
          {fieldErrors.username ? (
            <p className="mt-1.5 pl-1 text-xs text-[#ba1a1a]" id="username-error">
              {fieldErrors.username}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-2 block pl-1 text-[11px] font-bold uppercase leading-4 text-[#3f4851]"
            htmlFor="password"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]" />
            <input
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="current-password"
              className={`h-12 w-full rounded-xl border bg-white px-12 text-sm text-[#171c1f] outline-none transition focus:ring-4 ${
                fieldErrors.password
                  ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/10'
                  : 'border-[#bfc7d2] focus:border-[#006096] focus:ring-[#006096]/10'
              }`}
              id="password"
              name="password"
              onKeyUp={(event) => setIsCapsLockOn(event.getModifierState('CapsLock'))}
              placeholder="Nhập mật khẩu"
              required
              type={showPassword ? 'text' : 'password'}
            />
            <button
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[#707882] transition hover:bg-[#f0f5fa] hover:text-[#006096] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
          {isCapsLockOn ? (
            <p className="mt-1.5 pl-1 text-xs text-[#a05c00]" role="status">
              Caps Lock đang bật
            </p>
          ) : null}
          {fieldErrors.password ? (
            <p className="mt-1.5 pl-1 text-xs text-[#ba1a1a]" id="password-error">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <label className="flex items-center gap-2 text-[13px] text-[#3f4851]">
            <input
              checked={remember}
              className="h-5 w-5 rounded-md border-[#bfc7d2] accent-[#006096]"
              onChange={(event) => setRemember(event.target.checked)}
              name="remember"
              type="checkbox"
            />
            <span>
              Ghi nhớ đăng nhập
              <span className="block text-[10px] text-[#707882]">Không dùng trên máy dùng chung</span>
            </span>
          </label>
          <button
            className="text-[13px] font-semibold text-[#006096] transition hover:text-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
            onClick={() => setShowForgotPasswordModal(true)}
            type="button"
          >
            Quên mật khẩu?
          </button>
        </div>

        {initialReason === 'session_expired' ? (
          <p className="rounded-lg border border-[#9eefff] bg-[#effbff] px-3 py-2 text-sm text-[#005a7d]">
            Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004a75] via-[#006096] to-[#007abc] text-base font-bold text-white shadow-hms-button transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#006096]/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || retryAfterSeconds > 0}
          type="submit"
        >
          {isSubmitting
            ? 'Đang đăng nhập...'
            : retryAfterSeconds > 0
              ? `Vui lòng thử lại sau ${retryAfterSeconds}s`
              : 'Đăng nhập'}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#dfe3e7]" />
        <p className="text-[10px] font-bold uppercase leading-4 text-[#707882]">
          Hỗ trợ & liên hệ
        </p>
        <span className="h-px flex-1 bg-[#dfe3e7]" />
      </div>

      <footer className="mt-7 flex items-center justify-between gap-4 text-[11px]">
        <p className="font-medium text-[#3f4851]/60">
          © 2025 Clinical Excellence
        </p>
        <button
          className="flex items-center gap-1.5 font-bold text-[#006096] transition hover:text-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
          onClick={() => setShowForgotPasswordModal(true)}
          type="button"
        >
          <HeadsetIcon className="h-4 w-4" />
          Hỗ trợ kỹ thuật IT
        </button>
      </footer>

      {showForgotPasswordModal ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006096]/10 text-[#006096]">
                  <HeadsetIcon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#171c1f]">Quên mật khẩu</h3>
              </div>
              <button
                aria-label="Đóng"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#707882] transition hover:bg-[#f0f5fa] hover:text-[#171c1f]"
                onClick={() => setShowForgotPasswordModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="py-5 text-sm text-[#3f4851] leading-relaxed">
              Vui lòng liên hệ kỹ thuật viên IT để xử lý.
            </div>
            <div className="flex justify-end pt-2">
              <button
                className="rounded-xl bg-[#006096] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/20"
                onClick={() => setShowForgotPasswordModal(false)}
                type="button"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successState ? (
        <LoginSuccessOverlay
          fullName={successState.fullName}
          mustChangePassword={successState.mustChangePassword}
        />
      ) : null}
    </>
  );
}
