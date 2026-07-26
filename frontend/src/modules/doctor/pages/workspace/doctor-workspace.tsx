'use client';

import { useEffect, useMemo, useState } from 'react';

import { useLogout } from '@/shared/hooks/use-logout';
import { useRequireAuth } from '@/shared/hooks/use-require-auth';
import { DiagnosisScreen } from '../../components/diagnosis-screen';
import {
  EmptyState,
  PatientSummary,
  StepTabs,
  Topbar,
  visibleSteps,
  type DoctorScreen,
  type StepId,
} from '../../components/patient-header';
import { OrdersScreen } from '../../components/orders-screen';
import { PrescriptionScreen } from '../../components/prescription-screen';
import { ResultsScreen } from '../../components/results-screen';
import { Sidebar } from '../../components/sidebar';
import { cn } from '../../components/shared';
import { VitalsScreen } from '../../components/vitals-screen';
import { useDoctorWorklist, useMedicalRecordDetail } from '../../services/medical-record-api';
import { shouldResetSelectedRecord } from './doctor-workspace.state';
import { doctorWorkspaceStyles as styles } from './doctor-workspace.styles';

const WORKLIST_LABEL: Record<string, string> = {
  open: 'Chờ khám',
  waiting_results: 'Chờ kết quả xét nghiệm',
  diagnosed: 'Đã chẩn đoán',
  closed: 'Đã đóng hồ sơ',
};

export function DoctorWorkspacePage() {
  const { data: principal, isLoading: isAuthLoading, isError: isAuthError } = useRequireAuth();
  const logout = useLogout();
  const isAuthed = Boolean(principal) && !isAuthError;
  const { data: worklist, isLoading: isWorklistLoading, isError: isWorklistError } = useDoctorWorklist(
    principal?.userId ?? null,
    isAuthed,
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<DoctorScreen>('empty');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: detailResponse, isLoading: isDetailLoading } = useMedicalRecordDetail(
    selectedRecordId,
    principal?.userId ?? null,
    isAuthed,
  );
  const record = detailResponse?.record ?? null;

  const activeStep = useMemo<StepId>(() => (currentScreen === 'empty' ? 'vitals' : currentScreen), [currentScreen]);
  const steps = useMemo(() => visibleSteps(record?.diagnosis ?? null), [record?.diagnosis]);

  useEffect(() => {
    setSelectedRecordId(null);
    setCurrentScreen('empty');
    setSearchTerm('');
  }, [principal?.userId]);

  useEffect(() => {
    if (shouldResetSelectedRecord(selectedRecordId, worklist)) {
      setSelectedRecordId(null);
      setCurrentScreen('empty');
    }
  }, [selectedRecordId, worklist]);

  function handleSelectPatient(recordId: string) {
    setSelectedRecordId(recordId);
    setCurrentScreen('vitals');
  }

  /** Mirrors deselectPatient() in doctor.html — "Đóng hồ sơ" just clears the active chart, it
   * does not close/settle the record (that requires billing, not built in this scope). */
  function handleCloseRecord() {
    setSelectedRecordId(null);
    setCurrentScreen('empty');
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
    <main className={cn(styles.page, 'print:hidden')}>
      <Sidebar
        doctorName={principal?.fullName ?? 'Bác sĩ'}
        onLogout={logout}
        onSearchTermChange={setSearchTerm}
        onSelectPatient={handleSelectPatient}
        searchTerm={searchTerm}
        selectedRecordId={selectedRecordId}
        worklist={isWorklistLoading ? [] : worklist?.data ?? []}
      />
      <section className={styles.workspace}>
        <Topbar />
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
              <PatientSummary onCloseRecord={handleCloseRecord} record={record} worklistLabel={WORKLIST_LABEL[record.status] ?? record.status} />
              <StepTabs
                currentScreen={activeStep}
                hasNewResult={record.labTests.some((test) => test.status === 'resulted')}
                onChangeScreen={setCurrentScreen}
                steps={steps}
              />
              {activeStep === 'vitals' && <VitalsScreen doctorName={principal?.fullName ?? 'Bác sĩ'} record={record} />}
              {activeStep === 'orders' && <OrdersScreen record={record} />}
              {activeStep === 'results' && <ResultsScreen record={record} />}
              {activeStep === 'diagnosis' && (
                <DiagnosisScreen
                  onDiagnosed={(treatmentType) => {
                    if (treatmentType === 'outpatient') setCurrentScreen('prescription');
                  }}
                  record={record}
                />
              )}
              {activeStep === 'prescription' && <PrescriptionScreen record={record} />}
            </>
          )}
        </div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}
