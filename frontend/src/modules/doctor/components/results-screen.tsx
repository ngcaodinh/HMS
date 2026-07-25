'use client';

import { useState } from 'react';

import { downloadAttachmentUrl, useLabResultDetail } from '../services/medical-record-api';
import type { MedicalRecordDetail, RecordLabTestSummary } from '../types/medical-record.types';
import { formatStructuredResultEntries } from './format-structured-result';
import { AssetIcon, RESULT_TABLE_LABELS, cn, formatDateTimeVN } from './shared';
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
        {selected &&
          (selected.status === 'resulted' ? (
            <ResultDetail labTestId={selected.labTestId} />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold leading-6">{selected.testName}</h2>
                  <p className="text-[11px] leading-[16.5px] text-[#707882]">Đang chờ kỹ thuật viên thực hiện</p>
                </div>
              </div>
              <p className="rounded-md border border-dashed border-[#bfc7d2] bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#707882]">
                Xét nghiệm đang chờ kỹ thuật viên tiếp nhận và thực hiện.
              </p>
            </>
          ))}
      </section>
    </div>
  );
}

function ResultDetail({ labTestId }: { labTestId: string }) {
  const { data: detail, isLoading } = useLabResultDetail(labTestId);

  if (isLoading || !detail) {
    return <p className="py-10 text-center text-sm text-[#707882]">Đang tải kết quả...</p>;
  }

  const entries = formatStructuredResultEntries(detail.structuredResult, detail.referenceRanges, detail.patient.gender);
  const firstAttachment = detail.attachments[0];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold leading-6">{RESULT_TABLE_LABELS[detail.resultTableKey] ?? detail.testName}</h2>
          <p className="text-[11px] leading-[16.5px] text-[#707882]">
            {detail.resultedBy ? `KTV. ${detail.resultedBy}` : 'KTV. —'}
            {detail.signedAt ? ` · Xác nhận ${formatDateTimeVN(detail.signedAt)}` : ''}
            {` · Phiếu #${detail.reportCode ?? detail.labTestId.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className={styles.mutedButton} onClick={() => window.print()} type="button">
            In phiếu
          </button>
          {firstAttachment && (
            <a
              className={styles.outlineButton}
              href={downloadAttachmentUrl(firstAttachment.attachmentId)}
              rel="noreferrer"
              target="_blank"
            >
              Tải tệp đính kèm gốc
            </a>
          )}
        </div>
      </div>

      {detail.conclusion && (
        <div className={cn(styles.alertInfo, 'mb-4')}>
          <strong>Kết luận: </strong>
          {detail.conclusion}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Chỉ số</th>
              <th className={styles.th}>Kết quả</th>
              <th className={styles.th}>Đơn vị</th>
              <th className={styles.th}>Tham chiếu</th>
              <th className={styles.th}>Đánh giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {entries.length === 0 && (
              <tr>
                <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={5}>
                  Chưa có dữ liệu kết quả.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.label}>
                <td className={cn(styles.td, 'font-semibold text-[#001d32]')}>{entry.label}</td>
                <td className={cn(styles.td, entry.isNormal === false && 'font-bold text-[#ba1a1a]')}>{entry.value}</td>
                <td className={styles.td}>{entry.unit ?? '—'}</td>
                <td className={styles.td}>{entry.normalRange ?? '—'}</td>
                <td className={styles.td}>
                  {entry.isNormal === null ? (
                    '—'
                  ) : entry.isNormal ? (
                    <span className={styles.statusNormal}>Bình thường</span>
                  ) : (
                    <span className={styles.statusHigh}>{entry.direction === 'low' ? 'THẤP' : 'CAO'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
