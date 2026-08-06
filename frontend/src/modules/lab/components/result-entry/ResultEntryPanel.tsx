import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { AppToast } from '@/shared/components/AppToast';
import { useAppToast } from '@/shared/hooks/use-app-toast';

import { labWorkspaceStyles as styles } from '../../pages/workspace/lab-workspace.styles';
import {
  useLabTestDetail,
  useReceiveSpecimen,
  useRecordLabResult,
  useSavePathologyDraft,
} from '../../services/lab-test-api';
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
import {
  AssetIcon,
  calculateAge,
  cn,
  genderLabel,
  RESULT_TABLE_LABELS,
  RESULT_TABLE_TAB_ORDER,
  TextField,
} from '../SharedComponents';
import { AttachmentDropzone } from '../AttachmentDropzone';
import { BioChemistryForm } from './BioChemistryForm';
import { CbcForm } from './CbcForm';
import { MicrobiologyForm } from './MicrobiologyForm';
import { PathologyForm } from './PathologyForm';
import { UrinalysisForm } from './UrinalysisForm';
import { getBioChemistryFieldErrors } from '../../validation/bio-chemistry-validation';
import { getCbcFieldErrors } from '../../validation/cbc-validation';
import { getMicrobiologyFieldErrors } from '../../validation/microbiology-validation';
import { getPathologyFieldErrors } from '../../validation/pathology-validation';
import { getUrinalysisFieldErrors } from '../../validation/urinalysis-validation';

interface ResultEntryPanelProps {
  labTestId: string;
  onDone: () => void;
}

/** Tổng số chỉ số ước lượng cho thanh tiến độ; chỉ phục vụ hiển thị, không thay thế validator
 * cục bộ hoặc backend. */
const TOTAL_FIELDS_BY_TYPE: Record<ResultTableKey, number> = {
  xn_cong_thuc_mau: 17,
  xn_nuoc_tieu: 46,
  xn_vi_sinh: 47,
  xn_mo_benh_hoc: 12,
  xn_hoa_sinh_mau: 38,
};

/** Đếm các field đã có giá trị để hiển thị tiến độ nhập, không phân biệt field bắt buộc hay
 * hợp lệ. */
function countFilledFields(value: Record<string, unknown>): number {
  return Object.values(value).filter((v) => v !== undefined && v !== null && v !== '').length;
}

/**
 * Kiểm tra mã phiếu tùy chọn trước khi gửi kết quả.
 *
 * @param value - Mã phiếu người dùng nhập, tối đa 30 ký tự.
 * @returns Thông báo tiếng Việt khi sai giới hạn/định dạng, hoặc `undefined` nếu để trống/hợp lệ.
 */
function getReportCodeError(value: string): string | undefined {
  if (!value) return undefined;
  if (value.length > 30) return 'Mã phiếu không được vượt quá 30 ký tự.';
  if (!/^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/.test(value)) {
    return 'Mã phiếu chỉ được chứa chữ, số, dấu gạch ngang hoặc dấu gạch chéo.';
  }
  return undefined;
}

/** Chuẩn hóa lỗi field từ API về cùng key mà các form domain đang sử dụng. */
function normalizeApiFieldErrors(fields: Record<string, string[]>): Record<string, string[]> {
  return Object.entries(fields).reduce<Record<string, string[]>>(
    (normalized, [field, messages]) => {
      const key = field.replace(/^structuredResult\./, '');
      normalized[key] = [...(normalized[key] ?? []), ...messages];
      return normalized;
    },
    {},
  );
}

/**
 * Điều phối nhập, lưu nháp và xác nhận kết quả cho một phiếu xét nghiệm.
 *
 * @param labTestId - ID chỉ định xét nghiệm dùng để tải detail và gọi các mutation tương ứng.
 * @param onDone - Callback gọi sau khi backend ghi nhận kết quả thành công để quay về hàng đợi.
 * @remarks Detail và reference range đến từ React Query/API; form domain giữ draft controlled trong
 * local state. Khi mở phiếu `ordered`, panel tự gọi API nhận mẫu. Trạng thái loading hiển thị
 * placeholder; phiếu `resulted` chuyển sang thông báo chỉ đọc; lỗi validator hiển thị inline và lỗi
 * mutation/API field hiển thị qua field hoặc toast. Pathology có thêm lưu nháp, còn xác nhận cuối
 * luôn yêu cầu attachment và gửi signature confirmation qua service. Chi tiết thiếu hoặc query lỗi
 * không có empty/error/forbidden branch riêng; component không tự thay thế authorization backend,
 * quyền KTV phải được kiểm tra ở API.
 */
export function ResultEntryPanel({ labTestId, onDone }: ResultEntryPanelProps) {
  const { data: detail, isLoading } = useLabTestDetail(labTestId);
  const receiveSpecimenMutation = useReceiveSpecimen();
  const recordMutation = useRecordLabResult();
  const draftMutation = useSavePathologyDraft();

  const [structuredResult, setStructuredResult] = useState<StructuredResult>(null);
  const [attachment, setAttachment] = useState<LabTestAttachment | null>(null);
  const [conclusion, setConclusion] = useState('');
  const [reportCode, setReportCode] = useState('');
  const { hideToast, showToast, toast } = useAppToast(4500);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string[]>>({});

  // Chọn validator theo loại bảng; pathology được kiểm tra ở trạng thái hoàn tất để báo trước
  // các field bắt buộc.
  const localFieldErrors = useMemo(() => {
    if (!detail || !structuredResult) return {};
    switch (detail.resultTableKey) {
      case 'xn_cong_thuc_mau':
        return getCbcFieldErrors(structuredResult as CbcResult);
      case 'xn_hoa_sinh_mau':
        return getBioChemistryFieldErrors(structuredResult as BioChemistryResult);
      case 'xn_nuoc_tieu':
        return getUrinalysisFieldErrors(structuredResult as UrinalysisResult);
      case 'xn_vi_sinh':
        return getMicrobiologyFieldErrors(structuredResult as MicrobiologyResult);
      case 'xn_mo_benh_hoc':
        return getPathologyFieldErrors({
          ...(structuredResult as PathologyResult),
          trangThai: 'da_co_ket_qua',
        });
      default:
        return {};
    }
  }, [detail, structuredResult]);

  // Nạp snapshot một lần cho mỗi phiếu; các lần refetch sau đó không được ghi đè draft người dùng
  // đang sửa.
  if (detail && initializedFor !== labTestId) {
    setStructuredResult(
      detail.structuredResult ??
        (detail.resultTableKey === 'xn_mo_benh_hoc' ? { trangThai: 'cho_ket_qua' } : {}),
    );
    setAttachment(detail.attachments[0] ?? null);
    setConclusion(detail.conclusion ?? '');
    setReportCode(detail.reportCode ?? '');
    setInitializedFor(labTestId);
  }

  // Đồng bộ trạng thái ordered với API khi mở phiếu; mutation tự invalidate queue/detail, effect
  // không đăng ký listener hoặc timer nên không có cleanup. Dependency labTestId bảo đảm đổi phiếu
  // sẽ xét lại trạng thái mẫu.
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
  const canSubmit = !recordMutation.isPending;
  const filledCount = countFilledFields(structuredResult as Record<string, unknown>);
  const totalCount = TOTAL_FIELDS_BY_TYPE[currentDetail.resultTableKey];
  const reportCodeError = getReportCodeError(reportCode);
  const conclusionError =
    // Chỉ phiếu vi sinh bắt buộc có kết luận chung trong hợp đồng nhập kết quả hiện tại.
    currentDetail.resultTableKey === 'xn_vi_sinh' && !conclusion.trim()
      ? 'Kết luận là bắt buộc đối với phiếu vi sinh.'
      : undefined;
  const normalizedApiFieldErrors = normalizeApiFieldErrors(apiFieldErrors);
  // Chỉ lộ lỗi sau blur/thay đổi hoặc submit; lỗi API được ưu tiên để phản ánh kết quả backend.
  const visibleFieldErrors = Object.keys({
    ...localFieldErrors,
    ...normalizedApiFieldErrors,
  }).reduce<Record<string, string>>((errors, field) => {
    if (hasSubmitted || touchedFields.has(field)) {
      errors[field] = normalizedApiFieldErrors[field]?.[0] ?? localFieldErrors[field];
    }
    return errors;
  }, {});

  // Ghi nhận field đã chạm để form không hiển thị lỗi cục bộ trước khi người dùng tương tác.
  function touchField(field: string) {
    setTouchedFields((current) => new Set(current).add(field));
  }

  /** Hiển thị lỗi thao tác bằng toast HMS; hook tự đóng toast sau khoảng thời gian đã cấu hình. */
  function showPopup(message: string) {
    showToast(message, 'error');
  }

  /**
   * Nhận draft mới từ form domain, đánh dấu field thay đổi và xóa lỗi field cũ từ API.
   * Khi có kháng sinh đồ, lỗi thiếu chủng vi khuẩn cũng được đánh dấu để phản hồi ngay trên form.
   */
  function handleStructuredResultChange(next: StructuredResult) {
    const previous = (structuredResult ?? {}) as Record<string, unknown>;
    const current = (next ?? {}) as Record<string, unknown>;
    new Set([...Object.keys(previous), ...Object.keys(current)]).forEach((field) => {
      if (current[field] !== previous[field]) touchField(field);
    });
    if (detail?.resultTableKey === 'xn_vi_sinh') {
      Object.keys(getMicrobiologyFieldErrors(next as MicrobiologyResult)).forEach(touchField);
    }
    setApiFieldErrors({});
    setStructuredResult(next);
  }

  /** Cập nhật mã phiếu tùy chọn, đánh dấu đã chạm và xóa lỗi API cũ của field này. */
  function handleReportCodeChange(value: string) {
    touchField('reportCode');
    setApiFieldErrors({});
    setReportCode(value);
  }

  /**
   * Xác thực attachment, field cục bộ và field API trước khi gửi mutation ghi/ký kết quả.
   * Thành công gọi `onDone`; lỗi field được gắn lại vào form và lỗi hệ thống hiển thị bằng toast.
   */
  function submitFinal() {
    setHasSubmitted(true);
    setTouchedFields(new Set(Object.keys(localFieldErrors)));
    if (!attachment) {
      showPopup('Cần tải lên tệp đính kèm trước khi xác nhận kết quả.');
      return;
    }
    if (Object.keys(localFieldErrors).length > 0 || reportCodeError || conclusionError) {
      showPopup('Vui lòng kiểm tra và sửa các trường đang báo lỗi trước khi xác nhận.');
      return;
    }
    const finalResult = isPathology
      ? { ...(structuredResult as PathologyResult), trangThai: 'da_co_ket_qua' as const }
      : structuredResult;
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
        onError: (error) => {
          if (error instanceof ApiError && error.fields) setApiFieldErrors(error.fields);
          showPopup(error instanceof Error ? error.message : 'Không thể ghi nhận kết quả.');
        },
      },
    );
  }

  /** Lưu riêng draft pathology với trạng thái `cho_ket_qua`; lỗi lưu nháp chỉ hiển thị toast. */
  function saveDraft() {
    draftMutation.mutate(
      {
        labTestId,
        structuredResult: { ...(structuredResult as PathologyResult), trangThai: 'cho_ket_qua' },
      },
      { onError: () => showPopup('Không thể lưu nháp.') },
    );
  }

  return (
    <div>
      <div className={styles.patientChipBar}>
        <span className={styles.patientChip}>MBA: {currentDetail.patient.patientCode}</span>
        <span className={styles.patientChipMuted}>
          {currentDetail.patient.fullName} · {calculateAge(currentDetail.patient.dateOfBirth)} tuổi
          · {genderLabel(currentDetail.patient.gender)}
          {currentDetail.patient.healthInsuranceCode
            ? ` · BHYT: ${currentDetail.patient.healthInsuranceCode}`
            : ''}
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
        {currentDetail.isUrgent && (
          <span className={cn(styles.chip, styles.chipDanger)}>Cấp cứu</span>
        )}
      </div>

      <div className={styles.tabSwitcher}>
        {RESULT_TABLE_TAB_ORDER.map((key) => (
          <button
            className={cn(
              styles.tabSwitcherItem,
              key === currentDetail.resultTableKey && styles.tabSwitcherItemActive,
            )}
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
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <TextField
              error={hasSubmitted || touchedFields.has('reportCode') ? reportCodeError : undefined}
              label="Mã phiếu (tuỳ chọn)"
              onBlur={() => touchField('reportCode')}
              onChange={handleReportCodeChange}
              value={reportCode}
            />
          </div>

          {currentDetail.resultTableKey === 'xn_hoa_sinh_mau' && (
            <BioChemistryForm
              errors={visibleFieldErrors}
              onChange={handleStructuredResultChange}
              onFieldBlur={touchField}
              patientGender={currentDetail.patient.gender}
              referenceRanges={currentDetail.referenceRanges}
              value={structuredResult as BioChemistryResult}
            />
          )}
          {currentDetail.resultTableKey === 'xn_cong_thuc_mau' && (
            <CbcForm
              errors={visibleFieldErrors}
              onChange={handleStructuredResultChange}
              onFieldBlur={touchField}
              value={structuredResult as CbcResult}
            />
          )}
          {currentDetail.resultTableKey === 'xn_nuoc_tieu' && (
            <UrinalysisForm
              errors={visibleFieldErrors}
              onChange={handleStructuredResultChange}
              onFieldBlur={touchField}
              value={structuredResult as UrinalysisResult}
            />
          )}
          {currentDetail.resultTableKey === 'xn_vi_sinh' && (
            <MicrobiologyForm
              errors={visibleFieldErrors}
              onChange={handleStructuredResultChange}
              onFieldBlur={touchField}
              value={structuredResult as MicrobiologyResult}
            />
          )}
          {isPathology && (
            <PathologyForm
              errors={visibleFieldErrors}
              onChange={handleStructuredResultChange}
              onFieldBlur={touchField}
              value={structuredResult as PathologyResult}
            />
          )}

          <div className="mt-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#3f4851]">
                Kết luận chung
              </span>
              <textarea
                aria-describedby={
                  conclusionError && (hasSubmitted || touchedFields.has('conclusion'))
                    ? 'conclusion-error'
                    : undefined
                }
                aria-invalid={Boolean(
                  conclusionError && (hasSubmitted || touchedFields.has('conclusion')),
                )}
                className={styles.textarea}
                onBlur={() => touchField('conclusion')}
                onChange={(event) => {
                  touchField('conclusion');
                  setConclusion(event.target.value);
                }}
                value={conclusion}
              />
              {conclusionError && (hasSubmitted || touchedFields.has('conclusion')) && (
                <p
                  className="mt-1 text-[11px] font-medium text-[#ba1a1a]"
                  id="conclusion-error"
                  role="alert"
                >
                  {conclusionError}
                </p>
              )}
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
              <button
                className={styles.outlineButton}
                disabled={draftMutation.isPending}
                onClick={saveDraft}
                type="button"
              >
                <AssetIcon className="h-4 w-4 brightness-0" name="icon-save.svg" />
                {draftMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
            )}
            <button
              className={styles.primaryButton}
              disabled={!canSubmit}
              onClick={submitFinal}
              type="button"
            >
              {recordMutation.isPending ? 'Đang xử lý...' : 'Xác nhận & Ký kết quả'}
            </button>
          </div>
        </div>

        <div className={styles.stickyPanel}>
          <div className={styles.card}>
            <p className={styles.formSectionTitle}>Tệp kết quả đính kèm *</p>
            <AttachmentDropzone
              labTestId={labTestId}
              onUploaded={setAttachment}
              uploaded={attachment}
            />
            {hasSubmitted && !attachment && (
              <p className="mt-2 text-[11px] font-medium text-[#ba1a1a]" role="alert">
                Cần tải lên tệp đính kèm trước khi xác nhận kết quả.
              </p>
            )}
          </div>
        </div>
      </div>
      <AppToast centered message={toast.message} onClose={hideToast} tone={toast.tone} />
    </div>
  );
}
