'use client';

import { useState } from 'react';

import { downloadLabAttachmentUrl, useLabTestResult } from '../services/lab-result-api';
import type { MedicalRecordDetail, RecordLabTestSummary } from '../types/medical-record.types';
import { AssetIcon, cn } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

/** Doctor's view is a read-only summary — no per-type edit forms like the lab technician's
 * result-entry screens, so field labels are derived generically rather than duplicating that
 * module's large label dictionary here (kept intentionally independent, no cross-module import). */
function prettifyFieldName(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^ksd/, 'KS ')
    .replace(/^./, (char) => char.toUpperCase());
}

const SKIP_FIELDS = new Set(['id', 'labTestId', 'createdAt', 'updatedAt']);

function LabResultDetailView({ labTestId }: { labTestId: string }) {
  const { data, isLoading } = useLabTestResult(labTestId);

  if (isLoading || !data) {
    return <p className="py-6 text-center text-sm text-[#707882]">Đang tải kết quả...</p>;
  }

  const entries = Object.entries(data.structuredResult ?? {}).filter(
    ([key, value]) => !SKIP_FIELDS.has(key) && value !== null && value !== undefined && value !== '',
  );

  return (
    <div>
      {data.conclusion && (
        <p className={cn(styles.alertInfo, 'mb-4')}>
          <strong>Kết luận: </strong>
          {data.conclusion}
        </p>
      )}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Chỉ số</th>
              <th className={styles.th}>Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {entries.length === 0 && (
              <tr>
                <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={2}>
                  Chưa có dữ liệu chi tiết.
                </td>
              </tr>
            )}
            {entries.map(([key, value]) => (
              <tr className={styles.tableRow} key={key}>
                <td className={styles.td}>{prettifyFieldName(key)}</td>
                <td className={styles.td}>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.attachments.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#707882]">Tệp đính kèm</p>
          {data.attachments.map((attachment) => (
            <a
              className="text-sm text-[#006096] hover:underline"
              href={downloadLabAttachmentUrl(attachment.attachmentId)}
              key={attachment.attachmentId}
              rel="noreferrer"
              target="_blank"
            >
              {attachment.originalName}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

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
              <LabResultDetailView labTestId={selected.labTestId} />
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
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/30',
        isSelected ? 'border border-[#bfc7d2] bg-[#e8f5fb] text-[#006096]' : 'text-[#171c1f] hover:bg-[#f0f4f8]',
      )}
      onClick={onClick}
      type="button"
    >
      <span className={cn('h-2 w-2 rounded-full', test.status === 'resulted' ? 'bg-[#1b6e3f]' : 'bg-[#a05c00]')} />
      {test.testName}
    </button>
  );
}
