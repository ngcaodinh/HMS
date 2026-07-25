'use client';

import { useState } from 'react';

import { useLogout } from '@/shared/hooks/use-logout';
import { useRequireAuth } from '@/shared/hooks/use-require-auth';
import { HistoryScreen } from '../../components/history-screen';
import { QueueList, type QueueFilterTab } from '../../components/queue-list';
import { ReferenceRangeConfig } from '../../components/reference-range-config';
import { ResultEntryScreen } from '../../components/result-entry/result-entry-screen';
import { Sidebar, type LabScreen } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { usePendingLabTests } from '../../services/lab-test-api';
import { labWorkspaceStyles as styles } from './lab-workspace.styles';

const SECTION_COPY: Record<LabScreen, { subtitle: string; title: string }> = {
  queue: { title: 'Danh sách chỉ định xét nghiệm', subtitle: 'Danh sách phiếu xét nghiệm đã được bác sĩ chỉ định' },
  'result-entry': { title: 'Nhập kết quả xét nghiệm', subtitle: 'Chọn phiếu chờ kết quả để nhập chỉ số và ký xác nhận' },
  history: { title: 'Tra cứu lịch sử', subtitle: 'Tra cứu các phiếu xét nghiệm đã có kết quả' },
  config: { title: 'Thống kê hoạt động & cấu hình tham chiếu', subtitle: 'Theo dõi hoạt động khoa xét nghiệm và quản lý trị số tham chiếu' },
};

export function LabWorkspacePage() {
  const { data: principal, isLoading: isAuthLoading, isError: isAuthError } = useRequireAuth();
  const logout = useLogout();
  const isAuthed = Boolean(principal) && !isAuthError;

  const [screen, setScreen] = useState<LabScreen>('queue');
  const [selectedLabTestId, setSelectedLabTestId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [filterTab, setFilterTab] = useState<QueueFilterTab>('all');

  const { data: queueData, isLoading: isQueueLoading } = usePendingLabTests({});
  const { data: pendingCountData } = usePendingLabTests({ status: 'ordered' });

  if (isAuthLoading || isAuthError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafe] p-8 text-center">
        <p className="text-sm text-[#707882]">
          {isAuthError ? 'Đang chuyển về trang đăng nhập...' : 'Đang xác thực phiên đăng nhập...'}
        </p>
      </main>
    );
  }

  const technicianName = principal?.fullName ?? 'Kỹ thuật viên';
  const copy = SECTION_COPY[screen];

  return (
    <main className={styles.page}>
      <Sidebar
        onChangeScreen={(next) => {
          setScreen(next);
          if (next !== 'result-entry') setSelectedLabTestId(null);
        }}
        onLogout={logout}
        pendingCount={pendingCountData?.pagination.totalItems ?? 0}
        screen={screen}
        technicianName={technicianName}
      />
      <section className={styles.workspace}>
        <Topbar screen={screen} />

        <div className={styles.body}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionTitle}>{copy.title}</p>
            <p className={styles.sectionSubtitle}>{copy.subtitle}</p>
          </div>

          {screen === 'queue' && (
            <QueueList
              filterTab={filterTab}
              isLoading={isQueueLoading}
              keyword={keyword}
              list={queueData?.data ?? []}
              onChangeFilterTab={setFilterTab}
              onChangeKeyword={setKeyword}
              onPrint={() => window.print()}
              onSelect={(labTestId) => {
                setSelectedLabTestId(labTestId);
                setScreen('result-entry');
              }}
            />
          )}

          {screen === 'result-entry' && (
            <ResultEntryScreen onSelect={setSelectedLabTestId} selectedLabTestId={selectedLabTestId} />
          )}

          {screen === 'history' && <HistoryScreen />}

          {screen === 'config' && <ReferenceRangeConfig />}
        </div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
    </main>
  );
}
