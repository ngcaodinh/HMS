'use client';

import { useEffect, useMemo, useState } from 'react';

import { useLogout } from '@/shared/hooks/use-logout';
import { useRequireAuth } from '@/shared/hooks/use-require-auth';
import { DiagnosisScreen } from '../../components/DiagnosisScreen';
import {
  EmptyState,
  PatientSummary,
  StepTabs,
  Topbar,
  visibleSteps,
  type DoctorScreen,
  type StepId,
} from '../../components/PatientHeader';
import { OrdersScreen } from '../../components/OrdersScreen';
import { PrescriptionScreen } from '../../components/PrescriptionScreen';
import { ResultsScreen } from '../../components/ResultsScreen';
import { Sidebar } from '../../components/Sidebar';
import { cn } from '../../components/SharedComponents';
import { VitalsScreen } from '../../components/VitalsScreen';
import { useDoctorWorklist, useMedicalRecordDetail } from '../../services/medical-record-api';
import { shouldResetSelectedRecord } from './doctor-workspace.state';
import { doctorWorkspaceStyles as styles } from './doctor-workspace.styles';

/**
 * Ánh xạ trạng thái hồ sơ từ worklist sang nhãn hiển thị tại tóm tắt bệnh nhân.
 * Trạng thái chưa có nhãn riêng sẽ dùng chính giá trị server làm fallback tại nơi render.
 */
const WORKLIST_LABEL: Record<string, string> = {
  open: 'Chờ khám',
  waiting_results: 'Chờ kết quả xét nghiệm',
  diagnosed: 'Đã chẩn đoán',
  closed: 'Đã đóng hồ sơ',
};

/**
 * Điều phối workspace khám bệnh của bác sĩ từ lúc chọn hồ sơ đến các bước sinh hiệu, chỉ định,
 * kết quả, chẩn đoán và kê đơn.
 *
 * Worklist và detail hồ sơ là server state do các hook medical-record cung cấp; lựa chọn hồ sơ,
 * tab hiện tại và từ khóa tìm kiếm là local state. Trang có trạng thái xác thực, lỗi worklist,
 * rỗng khi chưa chọn hồ sơ, loading detail và nội dung thành công khi detail đã tải xong.
 * Logout và các callback chuyển bước được truyền xuống component con; việc hiển thị theo phiên
 * không thay thế kiểm tra quyền ở API/backend.
 *
 * @returns Giao diện workspace hoặc trạng thái loading/lỗi tương ứng.
 */
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

  // Khi chưa chọn hồ sơ, trạng thái rỗng không có tab; dùng Sinh hiệu làm bước mặc định
  // khi detail xuất hiện.
  const activeStep = useMemo<StepId>(() => (currentScreen === 'empty' ? 'vitals' : currentScreen), [currentScreen]);
  // Tab Đơn thuốc chỉ được hiển thị khi chẩn đoán server đã chọn hướng ngoại trú.
  const steps = useMemo(() => visibleSteps(record?.diagnosis ?? null), [record?.diagnosis]);

  // Khi dependency principal?.userId đổi, xóa toàn bộ local state để không hiển thị hồ sơ hoặc
  // bộ lọc của phiên trước; effect chỉ đồng bộ React state nên không có external subscription
  // cần cleanup.
  useEffect(() => {
    setSelectedRecordId(null);
    setCurrentScreen('empty');
    setSearchTerm('');
  }, [principal?.userId]);

  // Khi selectedRecordId hoặc worklist đổi, worklist có thể đã refresh; nếu record đang chọn
  // không còn thuộc danh sách server thì bỏ lựa chọn stale, không tạo external resource cần
  // cleanup.
  useEffect(() => {
    if (shouldResetSelectedRecord(selectedRecordId, worklist)) {
      setSelectedRecordId(null);
      setCurrentScreen('empty');
    }
  }, [selectedRecordId, worklist]);

  /**
   * Xử lý việc chọn một hồ sơ trong worklist và mở bước sinh hiệu khi detail bắt đầu tải.
   * @param recordId ID hồ sơ do Sidebar trả về từ worklist server.
   */
  function handleSelectPatient(recordId: string) {
    setSelectedRecordId(recordId);
    setCurrentScreen('vitals');
  }

  /**
   * Bỏ chọn hồ sơ khỏi workspace và trở về trạng thái rỗng.
   * Thao tác này chỉ thay đổi local state, không gửi mutation đóng hoặc tất toán hồ sơ lên server.
   */
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
    <main className={styles.page}>
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
                // EmptyState chỉ phát tín hiệu bắt đầu; page chọn record đầu tiên của
                // worklist hiện tại.
                const first = worklist?.data[0];
                if (first) handleSelectPatient(first.recordId);
              }}
            />
          )}

          {/* Không render nội dung hồ sơ cũ trong lúc detail của record mới đang được tải. */}
          {currentScreen !== 'empty' && isDetailLoading && (
            <p className="py-16 text-center text-sm text-[#707882]">Đang tải hồ sơ khám...</p>
          )}

          {currentScreen !== 'empty' && !isDetailLoading && record && (
            <>
              <PatientSummary
                onCloseRecord={handleCloseRecord}
                record={record}
                worklistLabel={WORKLIST_LABEL[record.status] ?? record.status}
              />
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
                    // Chỉ mở Tab 5A sau khi mutation chẩn đoán đã thành công và hướng là ngoại trú.
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
