import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import { downloadAttachmentUrl, useLabTestDetail } from '../services/lab-test-api';
import { AssetIcon, calculateAge, cn, formatDateTimeVN, genderLabel, RESULT_TABLE_LABELS } from './shared';
import { formatStructuredResultEntries } from './format-structured-result';

export function HistoryDetail({ labTestId }: { labTestId: string | null }) {
  const { data: detail, isLoading } = useLabTestDetail(labTestId);

  if (!labTestId) {
    return (
      <div className={cn(styles.card, styles.emptyState)}>
        <p>Chọn một phiếu xét nghiệm trong danh sách để xem chi tiết.</p>
      </div>
    );
  }

  if (isLoading || !detail) {
    return <p className="py-10 text-center text-sm text-[#707882]">Đang tải chi tiết...</p>;
  }

  const entries = formatStructuredResultEntries(
    detail.structuredResult as Record<string, unknown> | null,
    detail.referenceRanges,
    detail.patient.gender,
  );
  const firstAttachment = detail.attachments[0];

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#707882]">
            Phiếu xét nghiệm • #{detail.reportCode ?? detail.labTestId.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-1 text-lg font-bold text-[#171c1f]">{detail.patient.fullName}</p>
          <p className="mt-0.5 text-xs text-[#707882]">
            {calculateAge(detail.patient.dateOfBirth)} tuổi · {genderLabel(detail.patient.gender)}
            {detail.patient.healthInsuranceCode ? ` · BHYT: ${detail.patient.healthInsuranceCode}` : ''}
            {detail.department ? ` · ${detail.department.name}` : ''}
          </p>
        </div>
        {detail.status === 'resulted' ? (
          <span className={cn(styles.chip, styles.chipDanger)}>Đã ký</span>
        ) : (
          <span className={cn(styles.chip, styles.chipPending)}>Chờ kết quả</span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className={cn(styles.chip, styles.chipNeutral)}>{RESULT_TABLE_LABELS[detail.resultTableKey]}</span>
        {detail.diagnosis && (
          <span className={cn(styles.chip, styles.chipNeutral)}>
            Chẩn đoán: {detail.diagnosis.icd10} {detail.diagnosis.diagnosisText ?? ''}
          </span>
        )}
      </div>

      {detail.conclusion && (
        <div className={styles.alertInfo}>
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
              <th className={styles.th}>Bình thường</th>
              <th className={styles.th}>Đơn vị</th>
              <th className={styles.th}>Đạt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {entries.length === 0 && (
              <tr>
                <td className={cn(styles.td, 'text-center text-[#707882]')} colSpan={5}>
                  Chưa có dữ liệu kết quả.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.label}>
                <td className={styles.td}>{entry.label}</td>
                <td className={cn(styles.td, entry.isNormal === false && 'font-bold text-[#ba1a1a]')}>{entry.value}</td>
                <td className={styles.td}>{entry.normalRange ?? '—'}</td>
                <td className={styles.td}>{entry.unit ?? '—'}</td>
                <td className={styles.td}>
                  {entry.isNormal === null ? '—' : entry.isNormal ? (
                    <span className="text-[#1b6e3f]">✓</span>
                  ) : (
                    <span className="text-[#ba1a1a]">⚠</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[10px] border border-[#e5e7eb] p-4">
          <p className={styles.formSectionTitle}>Thông tin ký duyệt</p>
          {detail.signedBy ? (
            <div className="flex items-center gap-3">
              <div className={styles.userAvatar} style={{ background: '#006096' }}>
                {detail.signedBy.trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#171c1f]">{detail.signedBy}</p>
                <p className="text-xs text-[#707882]">
                  Đã ký bằng chữ ký số lúc {detail.signedAt ? formatDateTimeVN(detail.signedAt) : '—'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#707882]">Chưa ký duyệt.</p>
          )}
        </div>

        <div className="rounded-[10px] border border-[#e5e7eb] p-4">
          <p className={styles.formSectionTitle}>Tệp đính kèm ({detail.attachments.length})</p>
          <div className="flex flex-col gap-2">
            {detail.attachments.length === 0 && <p className="text-sm text-[#707882]">Không có tệp đính kèm.</p>}
            {detail.attachments.map((attachment) => (
              <a
                className={styles.attachmentChip}
                href={downloadAttachmentUrl(attachment.attachmentId)}
                key={attachment.attachmentId}
                rel="noreferrer"
                target="_blank"
              >
                <AssetIcon className="h-4 w-4" name="icon-lab-result.svg" />
                <span className="flex-1 truncate text-[#006096]">{attachment.originalName}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actionRow}>
        {firstAttachment && (
          <a
            className={styles.outlineButton}
            href={downloadAttachmentUrl(firstAttachment.attachmentId)}
            rel="noreferrer"
            target="_blank"
          >
            <AssetIcon className="h-4 w-4 brightness-0" name="icon-save.svg" />
            Tải tệp đính kèm
          </a>
        )}
        <button className={styles.primaryButton} onClick={() => window.print()} type="button">
          In kết quả xét nghiệm
        </button>
      </div>
    </div>
  );
}
