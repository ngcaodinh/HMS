import { useEffect, useState } from 'react';

import { labWorkspaceStyles as styles } from '../../pages/workspace/lab-workspace.styles';
import { useLabTestDetail, useReceiveSpecimen, useRecordLabResult, useSavePathologyDraft } from '../../services/lab-test-api';
import type {
  BioChemistryResult,
  CbcResult,
  LabTestAttachment,
  MicrobiologyResult,
  PathologyResult,
  ResultTableKey,
  StructuredResult,
  UrinalysisResult,
} from '../../types/lab-test.types';
import { AssetIcon, calculateAge, cn, genderLabel, RESULT_TABLE_LABELS, RESULT_TABLE_TAB_ORDER, TextField } from '../shared';
import { AttachmentDropzone } from '../attachment-dropzone';
import { BioChemistryForm } from './bio-chemistry-form';
import { CbcForm } from './cbc-form';
import { MicrobiologyForm } from './microbiology-form';
import { PathologyForm } from './pathology-form';
import { UrinalysisForm } from './urinalysis-form';

interface ResultEntryPanelProps {
  labTestId: string;
  onDone: () => void;
}

/** Tổng số chỉ số "chấm điểm" cho thanh tiến độ — ước lượng, chỉ phục vụ hiển thị, không dùng để
 * validate nghiệp vụ (validate thật nằm ở Zod schema backend). */
const TOTAL_FIELDS_BY_TYPE: Record<ResultTableKey, number> = {
  xn_cong_thuc_mau: 17,
  xn_nuoc_tieu: 46,
  xn_vi_sinh: 47,
  xn_mo_benh_hoc: 12,
  xn_hoa_sinh_mau: 38,
};

function countFilledFields(value: Record<string, unknown>): number {
  return Object.values(value).filter((v) => v !== undefined && v !== null && v !== '').length;
}

export function ResultEntryPanel({ labTestId, onDone }: ResultEntryPanelProps) {
  const { data: detail, isLoading } = useLabTestDetail(labTestId);
  const receiveSpecimenMutation = useReceiveSpecimen();
  const recordMutation = useRecordLabResult();
  const draftMutation = useSavePathologyDraft();

  const [structuredResult, setStructuredResult] = useState<StructuredResult>(null);
  const [attachment, setAttachment] = useState<LabTestAttachment | null>(null);
  const [conclusion, setConclusion] = useState('');
  const [reportCode, setReportCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  if (detail && initializedFor !== labTestId) {
    setStructuredResult(
      detail.structuredResult ?? (detail.resultTableKey === 'xn_mo_benh_hoc' ? { trangThai: 'cho_ket_qua' } : {}),
    );
    setAttachment(detail.attachments[0] ?? null);
    setConclusion(detail.conclusion ?? '');
    setReportCode(detail.reportCode ?? '');
    setInitializedFor(labTestId);
  }

  // "Tiếp nhận mẫu" tự động ngay khi mở phiếu còn ở trạng thái chờ mẫu — không có nút tiếp nhận
  // riêng trong ảnh mẫu, thao tác "Nhập KQ" ở hàng đợi coi như đã bao gồm bước này.
  useEffect(() => {
    if (detail?.status === 'ordered') receiveSpecimenMutation.mutate(labTestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.status, labTestId]);

  if (isLoading || !detail || !structuredResult) {
    return <p className="py-10 text-center text-sm text-[#707882]">Đang tải phiếu xét nghiệm...</p>;
  }

  if (detail.status === 'resulted') {
    return (
      <div className={styles.alertInfo}>
        Phiếu xét nghiệm này đã có kết quả. Xem chi tiết tại màn Lịch sử &amp; Tra cứu.
      </div>
    );
  }

  const currentDetail = detail;
  const isPathology = currentDetail.resultTableKey === 'xn_mo_benh_hoc';
  const canSubmit = Boolean(attachment) && !recordMutation.isPending;
  const filledCount = countFilledFields(structuredResult as Record<string, unknown>);
  const totalCount = TOTAL_FIELDS_BY_TYPE[currentDetail.resultTableKey];

  function submitFinal() {
    if (!attachment) {
      setErrorMessage('Cần tải lên tệp đính kèm trước khi xác nhận kết quả.');
      return;
    }
    setErrorMessage(null);
    const finalResult = isPathology ? { ...(structuredResult as PathologyResult), trangThai: 'da_co_ket_qua' as const } : structuredResult;
    recordMutation.mutate(
      {
        labTestId,
        resultTableKey: currentDetail.resultTableKey,
        structuredResult: finalResult,
        attachmentId: attachment.attachmentId,
        conclusion: conclusion || undefined,
        reportCode: reportCode || undefined,
      },
      {
        onSuccess: () => onDone(),
        onError: (error) => setErrorMessage(error instanceof Error ? error.message : 'Không thể ghi nhận kết quả.'),
      },
    );
  }

  function saveDraft() {
    draftMutation.mutate(
      { labTestId, structuredResult: { ...(structuredResult as PathologyResult), trangThai: 'cho_ket_qua' } },
      { onError: () => setErrorMessage('Không thể lưu nháp.') },
    );
  }

  return (
    <div>
      <div className={styles.patientChipBar}>
        <span className={styles.patientChip}>MBA: {currentDetail.patient.patientCode}</span>
        <span className={styles.patientChipMuted}>
          {currentDetail.patient.fullName} · {calculateAge(currentDetail.patient.dateOfBirth)} tuổi ·{' '}
          {genderLabel(currentDetail.patient.gender)}
          {currentDetail.patient.healthInsuranceCode ? ` · BHYT: ${currentDetail.patient.healthInsuranceCode}` : ''}
        </span>
        <span className={styles.patientChip}>
          {RESULT_TABLE_LABELS[currentDetail.resultTableKey]}
          {currentDetail.reportCode ? ` — ${currentDetail.reportCode}` : ''}
        </span>
        {currentDetail.diagnosis && (
          <span className={styles.patientChipMuted}>
            Chẩn đoán: {currentDetail.diagnosis.icd10} {currentDetail.diagnosis.diagnosisText ?? ''}
          </span>
        )}
        <span className={styles.patientChipMuted}>BS. {currentDetail.orderingDoctor.fullName}</span>
        {currentDetail.isUrgent && <span className={cn(styles.chip, styles.chipDanger)}>Cấp cứu</span>}
      </div>

      <div className={styles.tabSwitcher}>
        {RESULT_TABLE_TAB_ORDER.map((key) => (
          <button
            className={cn(styles.tabSwitcherItem, key === currentDetail.resultTableKey && styles.tabSwitcherItemActive)}
            disabled={key !== currentDetail.resultTableKey}
            key={key}
            type="button"
          >
            {RESULT_TABLE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className={styles.resultEntryGrid}>
        <div className={styles.card}>
          {errorMessage && <div className={styles.alertDanger}>{errorMessage}</div>}

          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Mã phiếu (tuỳ chọn)" onChange={setReportCode} value={reportCode} />
          </div>

          {currentDetail.resultTableKey === 'xn_hoa_sinh_mau' && (
            <BioChemistryForm
              onChange={(v) => setStructuredResult(v)}
              patientGender={currentDetail.patient.gender}
              referenceRanges={currentDetail.referenceRanges}
              value={structuredResult as BioChemistryResult}
            />
          )}
          {currentDetail.resultTableKey === 'xn_cong_thuc_mau' && (
            <CbcForm onChange={(v) => setStructuredResult(v)} value={structuredResult as CbcResult} />
          )}
          {currentDetail.resultTableKey === 'xn_nuoc_tieu' && (
            <UrinalysisForm onChange={(v) => setStructuredResult(v)} value={structuredResult as UrinalysisResult} />
          )}
          {currentDetail.resultTableKey === 'xn_vi_sinh' && (
            <MicrobiologyForm onChange={(v) => setStructuredResult(v)} value={structuredResult as MicrobiologyResult} />
          )}
          {isPathology && (
            <PathologyForm onChange={(v) => setStructuredResult(v)} value={structuredResult as PathologyResult} />
          )}

          <div className="mt-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">Kết luận chung</span>
              <textarea
                className={styles.textarea}
                onChange={(event) => setConclusion(event.target.value)}
                value={conclusion}
              />
            </label>
          </div>

          <div className={styles.progressBarWrap}>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.min(100, Math.round((filledCount / totalCount) * 100))}%` }}
              />
            </div>
            <span className={styles.progressBarLabel}>
              Đã nhập {filledCount}/{totalCount} chỉ số · Chưa ký duyệt
            </span>
          </div>

          <div className={styles.actionRow}>
            {isPathology && (
              <button className={styles.outlineButton} disabled={draftMutation.isPending} onClick={saveDraft} type="button">
                <AssetIcon className="h-4 w-4 brightness-0" name="icon-save.svg" />
                {draftMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
            )}
            <button className={styles.primaryButton} disabled={!canSubmit} onClick={submitFinal} type="button">
              {recordMutation.isPending ? 'Đang xử lý...' : 'Xác nhận & Ký kết quả'}
            </button>
          </div>
        </div>

        <div className={styles.stickyPanel}>
          <div className={styles.card}>
            <p className={styles.formSectionTitle}>Tệp kết quả đính kèm *</p>
            <AttachmentDropzone labTestId={labTestId} onUploaded={setAttachment} uploaded={attachment} />
          </div>
        </div>
      </div>
    </div>
  );
}
