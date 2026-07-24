'use client';

import { useMemo, useState } from 'react';

import { useRequireAuth } from '@/shared/hooks/use-require-auth';
import { DiagnosisScreen } from '../../components/diagnosis-screen';
import { EmptyState, PatientSummary, StepTabs, Topbar, type DoctorScreen, type StepId } from '../../components/patient-header';
import { OrdersScreen } from '../../components/orders-screen';
import { ResultsScreen } from '../../components/results-screen';
import { Sidebar } from '../../components/sidebar';
import { cn } from '../../components/shared';
import { VitalsScreen } from '../../components/vitals-screen';
import { useDoctorWorklist, useMedicalRecordDetail } from '../../services/medical-record-api';
import { doctorWorkspaceStyles as styles } from './doctor-workspace.styles';

const WORKLIST_LABEL: Record<string, string> = {
  open: 'Chờ khám',
  waiting_results: 'Chờ kết quả xét nghiệm',
  diagnosed: 'Đã chẩn đoán',
  closed: 'Đã đóng hồ sơ',
};

export function DoctorWorkspacePage() {
  const { data: principal, isLoading: isAuthLoading, isError: isAuthError } = useRequireAuth();
  const isAuthed = Boolean(principal) && !isAuthError;
  const { data: worklist, isLoading: isWorklistLoading, isError: isWorklistError } = useDoctorWorklist(isAuthed);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<DoctorScreen>('empty');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: detailResponse, isLoading: isDetailLoading } = useMedicalRecordDetail(selectedRecordId, isAuthed);
  const record = detailResponse?.record ?? null;

  const activeStep = useMemo<StepId>(() => (currentScreen === 'empty' ? 'vitals' : currentScreen), [currentScreen]);

  function handleSelectPatient(recordId: string) {
    setSelectedRecordId(recordId);
    setCurrentScreen('vitals');
  }

  if (isAuthLoading || isAuthError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafe] p-8 text-center">
        <p className="text-sm text-[#707882]">
          {isAuthError ? 'Đang chuyển về trang đăng nhập...' : 'Đang xác thực phiên đăng nhập...'}
        </p>
      </main>
    );
  }

  if (isWorklistError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafe] p-8 text-center">
        <p className="text-sm text-[#ba1a1a]">
          Không thể tải danh sách bệnh nhân. Vui lòng kiểm tra kết nối và tải lại trang.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Sidebar
        doctorName={principal?.fullName ?? 'Bác sĩ'}
        onSearchTermChange={setSearchTerm}
        onSelectPatient={handleSelectPatient}
        searchTerm={searchTerm}
        selectedRecordId={selectedRecordId}
        worklist={isWorklistLoading ? [] : worklist?.data ?? []}
      />
      <section className={styles.workspace}>
        <Topbar hasPatient={currentScreen !== 'empty'} />
        <div className={cn(styles.body, currentScreen === 'empty' && styles.bodyEmpty)}>
          {currentScreen === 'empty' && (
            <EmptyState
              onStart={() => {
                const first = worklist?.data[0];
                if (first) handleSelectPatient(first.recordId);
              }}
            />
          )}

          {currentScreen !== 'empty' && isDetailLoading && (
            <p className="py-16 text-center text-sm text-[#707882]">Đang tải hồ sơ khám...</p>
          )}

          {currentScreen !== 'empty' && !isDetailLoading && record && (
            <>
              <PatientSummary record={record} worklistLabel={WORKLIST_LABEL[record.status] ?? record.status} />
              <StepTabs currentScreen={activeStep} hasNewResult={record.labTests.some((test) => test.status === 'resulted')} onChangeScreen={setCurrentScreen} />
              {activeStep === 'vitals' && <VitalsScreen doctorName={principal?.fullName ?? 'Bác sĩ'} record={record} />}
              {activeStep === 'orders' && <OrdersScreen record={record} />}
              {activeStep === 'results' && <ResultsScreen record={record} />}
              {activeStep === 'diagnosis' && <DiagnosisScreen record={record} />}
            </>
          )}
        </div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}
