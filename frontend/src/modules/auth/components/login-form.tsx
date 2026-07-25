'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/shared/api-client';
import { ApiError } from '@/shared/api-client';

type IconProps = {
  className?: string;
};

type LoginResponse = {
  principal: {
    mustChangePassword: boolean;
    roleCodes: string[];
  };
};

const loginFailedMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';

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

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Đăng nhập qua BFF; điều hướng bắt đổi mật khẩu trước khi vào workspace.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await apiClient<LoginResponse>('/api/auth/login', {
        body: {
          password: String(formData.get('password') ?? ''),
          username: String(formData.get('username') ?? '').trim(),
        },
        method: 'POST',
      });

      if (result.principal.mustChangePassword) {
        router.replace('/change-password');
        return;
      }

      if (result.principal.roleCodes.includes('it_tech')) {
        router.replace('/it-technician');
        return;
      }

      router.replace('/');
    } catch (caught) {
      const message = caught instanceof ApiError && [400, 401].includes(caught.status)
        ? loginFailedMessage
        : 'Không thể đăng nhập, vui lòng thử lại';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
              autoComplete="username"
              className="h-12 w-full rounded-xl border border-[#bfc7d2] bg-white px-12 text-sm text-[#171c1f] outline-none transition placeholder:text-[#bfc7d2] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
              id="username"
              name="username"
              placeholder="Mã nhân viên hoặc tên đăng nhập"
              required
              type="text"
            />
          </div>
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
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-[#bfc7d2] bg-white px-12 text-sm text-[#171c1f] outline-none transition placeholder:text-[#bfc7d2] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
              id="password"
              name="password"
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
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <label className="flex items-center gap-2 text-[13px] text-[#3f4851]">
            <input
              className="h-5 w-5 rounded-md border-[#bfc7d2] accent-[#006096]"
              name="remember"
              type="checkbox"
            />
            Ghi nhớ đăng nhập
          </label>
          <a
            className="text-[13px] font-semibold text-[#006096] transition hover:text-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
            href="#forgot-password"
          >
            Quên mật khẩu?
          </a>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004a75] via-[#006096] to-[#007abc] text-base font-bold text-white shadow-hms-button transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#006096]/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
        <a
          className="flex items-center gap-1.5 font-bold text-[#006096] transition hover:text-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
          href="#it-support"
        >
          <HeadsetIcon className="h-4 w-4" />
          Hỗ trợ kỹ thuật IT
        </a>
      </footer>
    </>
  );
}
