import { useState } from 'react';

import { usePendingLabTests } from '../services/lab-test-api';
import { HistoryDetail } from './HistoryDetail';
import { HistoryList } from './HistoryList';

/**
 * Điều phối màn hình tra cứu lịch sử xét nghiệm đã hoàn tất.
 *
 * @returns Bố cục gồm danh sách history và vùng chi tiết phiếu đang chọn.
 * @remarks Dữ liệu danh sách lấy từ GET `/lab-tests` với status `resulted`; keyword và selectedId
 * chỉ là UI state tại màn hình. `HistoryDetail` tự tải chi tiết và xử lý loading/empty/print.
 * Query/access/error do API và React Query quyết định; component không tự suy diễn quyền từ UI.
 */
export function HistoryScreen() {
  const { data, isLoading } = usePendingLabTests({ status: 'resulted' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <HistoryList
        isLoading={isLoading}
        keyword={keyword}
        list={data?.data ?? []}
        onChangeKeyword={setKeyword}
        onSelect={setSelectedId}
        selectedId={selectedId}
      />
      <HistoryDetail labTestId={selectedId} />
    </div>
  );
}
