'use client';

import { useEffect, useState } from 'react';

import { useLogout } from '@/shared/hooks/use-logout';
import { useRequireAuth } from '@/shared/hooks/use-require-auth';
import { DispenseDetail } from '../../components/dispense-detail';
import { DispenseList } from '../../components/dispense-list';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { useDispensablePrescriptions, useDispensePrescription, useRejectPrescription } from '../../services/prescription-dispense-api';
import { pharmacyWorkspaceStyles as styles } from './pharmacy-workspace.styles';

export function PharmacyWorkspacePage() {
  const { data: principal, isLoading: isAuthLoading, isError: isAuthError } = useRequireAuth();
  const logout = useLogout();
  const isAuthed = Boolean(principal) && !isAuthError;

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'dispensed'>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useDispensablePrescriptions({ keyword, dispensed: statusFilter === 'dispensed' });
  const list = data?.data ?? [];
  const selected = list.find((item) => item.prescriptionId === selectedId) ?? null;

  const dispenseMutation = useDispensePrescription();
  const rejectMutation = useRejectPrescription();

  useEffect(() => {
    if (!isAuthed) return;
    if (selectedId && !list.some((item) => item.prescriptionId === selectedId)) setSelectedId(null);
  }, [isAuthed, list, selectedId]);

  if (isAuthLoading || isAuthError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafe] p-8 text-center">
        <p className="text-sm text-[#707882]">
          {isAuthError ? 'Đang chuyển về trang đăng nhập...' : 'Đang xác thực phiên đăng nhập...'}
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Sidebar onLogout={logout} pharmacistName={principal?.fullName ?? 'Dược sĩ'} />
      <section className={styles.workspace}>
        <Topbar pharmacistName={principal?.fullName ?? 'Dược sĩ'} />

        <div className={styles.body}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionTitle}>Cấp phát thuốc theo đơn</p>
            <p className={styles.sectionSubtitle}>Danh sách đơn thuốc điện tử đã được bác sĩ ký chờ cấp phát</p>
          </div>

          {isError && (
            <p className="mb-4 rounded-md border border-[#ffdad6] bg-[#fff5f4] px-4 py-3 text-sm text-[#ba1a1a]">
              Không thể tải danh sách đơn thuốc. Vui lòng kiểm tra kết nối và tải lại trang.
            </p>
          )}

          <DispenseList
            isLoading={isLoading}
            keyword={keyword}
            list={list}
            onChangeKeyword={setKeyword}
            onChangeStatusFilter={(value) => {
              setStatusFilter(value);
              setSelectedId(null);
            }}
            onSelect={setSelectedId}
            selectedId={selectedId}
            statusFilter={statusFilter}
          />

          {selected ? (
            <DispenseDetail
              isDispensing={dispenseMutation.isPending}
              isRejecting={rejectMutation.isPending}
              onDispense={() =>
                dispenseMutation.mutate(
                  { prescriptionId: selected.prescriptionId, expectedVersion: selected.version },
                  { onSuccess: () => setSelectedId(null) },
                )
              }
              onReject={(reason) =>
                rejectMutation.mutate(
                  { prescriptionId: selected.prescriptionId, expectedVersion: selected.version, cancelReason: reason },
                  { onSuccess: () => setSelectedId(null) },
                )
              }
              prescription={selected}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>Chọn một đơn thuốc trong danh sách để xem chi tiết và xử lý cấp phát.</p>
            </div>
          )}
        </div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}
