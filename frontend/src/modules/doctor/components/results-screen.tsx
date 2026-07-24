'use client';

import { useState } from 'react';

import type { MedicalRecordDetail, RecordLabTestSummary } from '../types/medical-record.types';
import { AssetIcon, cn } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

export function ResultsScreen({ record }: { record: MedicalRecordDetail }) {
  const [selectedId, setSelectedId] = useState<string | null>(record.labTests[0]?.labTestId ?? null);
  const selected = record.labTests.find((test) => test.labTestId === selectedId) ?? null;

  if (record.labTests.length === 0) {
    return (
      <section className={styles.card}>
        <p className="text-sm text-[#707882]">Chưa có chỉ định xét nghiệm nào cho hồ sơ này.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
      <aside className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <AssetIcon className="h-[18px] w-[18px]" name="icon-lab-result.svg" />
          </span>
          Kết quả cận lâm sàng
        </h2>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.6px] text-[#707882]">Dịch vụ đã chỉ định</p>
        <div className="mt-3 space-y-2">
          {record.labTests.map((test) => (
            <TestListItem
              isSelected={test.labTestId === selectedId}
              key={test.labTestId}
              onClick={() => setSelectedId(test.labTestId)}
              test={test}
            />
          ))}
        </div>
      </aside>

      <section className={styles.card}>
        {selected && (
          <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold leading-6">{selected.testName}</h2>
                <p className="text-[11px] leading-[16.5px] text-[#707882]">
                  {selected.status === 'resulted' ? 'Đã có kết quả xét nghiệm' : 'Đang chờ kỹ thuật viên thực hiện'}
                </p>
              </div>
            </div>
            {selected.status === 'resulted' ? (
              <p className="rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-4 py-6 text-center text-sm text-[#3f4851]">
                Chỉ số chi tiết của kết quả xét nghiệm sẽ hiển thị ở đây sau khi hoàn thiện màn nhập
                kết quả của kỹ thuật viên xét nghiệm.
              </p>
            ) : (
              <p className="rounded-md border border-dashed border-[#bfc7d2] bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#707882]">
                Xét nghiệm đang chờ kỹ thuật viên tiếp nhận và thực hiện.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function TestListItem({
  isSelected,
  onClick,
  test,
}: {
  isSelected: boolean;
  onClick: () => void;
  test: RecordLabTestSummary;
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium',
        isSelected ? 'border border-[#bfc7d2] bg-[#e8f5fb] text-[#006096]' : 'text-[#171c1f]',
      )}
      onClick={onClick}
      type="button"
    >
      <span className={cn('h-2 w-2 rounded-full', test.status === 'resulted' ? 'bg-[#1b6e3f]' : 'bg-[#a05c00]')} />
      {test.testName}
    </button>
  );
}
