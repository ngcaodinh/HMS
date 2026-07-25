import { useState } from 'react';

import { usePendingLabTests } from '../services/lab-test-api';
import { HistoryDetail } from './history-detail';
import { HistoryList } from './history-list';

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
