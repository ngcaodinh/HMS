'use client';

import { useEffect, useMemo, useState } from 'react';

import { useCurrentPrincipal } from '@/shared/hooks/use-current-principal';
import { useLogout } from '@/shared/hooks/use-logout';

import { DispenseDetail } from '../../components/dispense-detail';
import { DispenseList } from '../../components/dispense-list';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import {
  useDispensablePrescriptions,
  useDispensePrescription,
  useRejectPrescription,
} from '../../services/prescription-dispense-api';
import type { DispensablePrescription } from '../../types/prescription-dispense.types';
import { pharmacyWorkspaceStyles as styles } from './pharmacy-workspace.styles';

type StatusFilter = 'pending' | 'dispensed';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** Điều phối workspace dược qua API thật cho luồng danh sách, cấp phát và trả đơn thuốc. */
export function PharmacyWorkspace() {
  const logout = useLogout();
  const principalQuery = useCurrentPrincipal();
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const prescriptionsQuery = useDispensablePrescriptions({
    dispensed: statusFilter === 'dispensed',
    keyword,
  });
  const dispenseMutation = useDispensePrescription();
  const rejectMutation = useRejectPrescription();

  const prescriptionData = prescriptionsQuery.data?.data;
  const prescriptions = useMemo(() => prescriptionData ?? [], [prescriptionData]);
  const selectedPrescription = useMemo<DispensablePrescription | null>(
    () => prescriptions.find((prescription) => prescription.prescriptionId === selectedId) ?? null,
    [prescriptions, selectedId],
  );

  useEffect(() => {
    if (selectedId && prescriptions.some((prescription) => prescription.prescriptionId === selectedId)) return;
    setSelectedId(prescriptions[0]?.prescriptionId ?? null);
  }, [prescriptions, selectedId]);

  const pharmacistName = principalQuery.data?.fullName ?? 'Dược sĩ';

  const showToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((previous) => [...previous, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const handleDispense = () => {
    if (!selectedPrescription) return;

    dispenseMutation.mutate(
      {
        expectedVersion: selectedPrescription.version,
        prescriptionId: selectedPrescription.prescriptionId,
      },
      {
        onError: (error) =>
          showToast(getErrorMessage(error, 'Không thể xác nhận cấp phát đơn thuốc.'), 'error'),
        onSuccess: () => showToast('Đã xác nhận cấp phát đơn thuốc.', 'success'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!selectedPrescription) return;

    rejectMutation.mutate(
      {
        cancelReason: reason,
        expectedVersion: selectedPrescription.version,
        prescriptionId: selectedPrescription.prescriptionId,
      },
      {
        onError: (error) => showToast(getErrorMessage(error, 'Không thể trả đơn thuốc.'), 'error'),
        onSuccess: () => showToast('Đã trả đơn thuốc về bác sĩ kê đơn.', 'warning'),
      },
    );
  };

  return (
    <div className={styles.shell}>
      <Sidebar onLogout={() => void logout()} pharmacistName={pharmacistName} />

      <div className={styles.mainWrap}>
        <Topbar pharmacistName={pharmacistName} />

        <main className={styles.contentArea}>
          <section className={styles.screenHeader}>
            <div>
              <h1 className={styles.screenTitle}>Cấp phát thuốc theo đơn</h1>
              <p className={styles.screenSubtitle}>
                {prescriptionsQuery.data?.pagination.totalItems ?? 0} đơn trong hàng chờ hiện tại
              </p>
            </div>
            <div className={styles.screenActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => void prescriptionsQuery.refetch()}
                type="button"
              >
                Làm mới
              </button>
            </div>
          </section>

          {prescriptionsQuery.error && (
            <div className={styles.alertDanger} role="alert">
              {getErrorMessage(prescriptionsQuery.error, 'Không thể tải danh sách đơn thuốc.')}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(520px,0.95fr)_minmax(440px,1.05fr)]">
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <p className={styles.cardTitle}>Hàng chờ cấp phát</p>
              </div>
              <div className={styles.cardBody}>
                <DispenseList
                  isLoading={prescriptionsQuery.isLoading}
                  keyword={keyword}
                  list={prescriptions}
                  onChangeKeyword={setKeyword}
                  onChangeStatusFilter={setStatusFilter}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                  statusFilter={statusFilter}
                />
              </div>
            </div>

            {selectedPrescription ? (
              <DispenseDetail
                isDispensing={dispenseMutation.isPending}
                isRejecting={rejectMutation.isPending}
                onDispense={handleDispense}
                onReject={handleReject}
                prescription={selectedPrescription}
              />
            ) : (
              <div className={styles.card}>
                <div className={styles.cardBody}>
                  <p className="text-[13px] text-[#707882]">Chưa có đơn thuốc phù hợp để hiển thị.</p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            className={`pointer-events-auto rounded-lg px-4 py-3 text-[13px] font-semibold text-white shadow-lg ${
              toast.type === 'success'
                ? 'bg-[#1a7a4a]'
                : toast.type === 'warning'
                  ? 'bg-[#a05c00]'
                  : toast.type === 'error'
                    ? 'bg-[#ba1a1a]'
                    : 'bg-[#006096]'
            }`}
            key={toast.id}
            role="status"
          >
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PharmacyWorkspace;
