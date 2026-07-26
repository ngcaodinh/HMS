import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PharmacyWorkspace } from '@/modules/pharmacy';
import { backendFetch } from '@/shared/auth/backend';

export const metadata: Metadata = {
  title: 'Quản lý Dược & Nhà thuốc | HMS-VN',
  description: 'Phân hệ Quản lý Dược, Cấp phát thuốc theo đơn & Quản lý kho FEFO cho Dược sĩ.',
};

export default async function PharmacyPage() {
  const response = await backendFetch('/auth/me');

  if (response.status === 401) redirect('/login');

  const payload = await response.json();
  const roleCodes = payload?.data?.roleCodes ?? [];
  const canAccessPharmacy = roleCodes.includes('pharmacist') || roleCodes.includes('admin');

  if (!canAccessPharmacy) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.8px] text-red-700">403</p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">Không đủ quyền truy cập</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Chỉ dược sĩ hoặc admin được mở phân hệ cấp phát và quản lý kho thuốc.
          </p>
        </section>
      </main>
    );
  }

  return <PharmacyWorkspace />;
}
