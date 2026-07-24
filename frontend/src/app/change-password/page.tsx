import { redirect } from 'next/navigation';

import { ChangePasswordForm } from '@/modules/auth/components/change-password-form';
import { backendFetch } from '@/shared/auth/backend';

/**
 * Trang đổi mật khẩu bắt buộc, chỉ hiển thị khi principal có mustChangePassword.
 */
export default async function ChangePasswordPage() {
  const response = await backendFetch('/auth/me');

  if (response.status === 401) redirect('/login');
  if (!response.ok) redirect('/login');

  const payload = await response.json();
  const principal = payload?.data;
  const roleCodes = Array.isArray(principal?.roleCodes) ? principal.roleCodes : [];

  if (!principal?.mustChangePassword) {
    if (roleCodes.includes('it_tech') || roleCodes.includes('admin')) {
      redirect('/it-technician');
    }

    redirect('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50/70 px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <section className="w-full rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/40 transition-all">
          <div className="mb-5 flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                Bảo mật tài khoản
              </p>
              <h1 className="text-xl font-bold text-slate-900">
                Đổi mật khẩu bắt buộc
              </h1>
            </div>
          </div>

          <p className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
            Vì lý do an toàn thông tin, bạn cần đổi mật khẩu mới lần đầu đăng nhập tài khoản.
          </p>

          <ChangePasswordForm />
        </section>
      </div>
    </main>
  );
}
