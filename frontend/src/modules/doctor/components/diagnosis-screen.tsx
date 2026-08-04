'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { useDiagnoseMedicalRecord, useIcd10Catalog } from '../services/medical-record-api';
import { useLatestPrescription } from '../services/prescription-api';
import type { Icd10Entry, MedicalRecordDetail, TreatmentType } from '../types/medical-record.types';
import { DoctorFeedbackModal } from './doctor-feedback-modal';
import { AssetIcon, cn } from './shared';
import { FieldError, getFieldErrorMap } from './field-error';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

const PLAN_LABEL: Record<TreatmentType, string> = {
  outpatient: 'Ngoại trú → Tab 5A Đơn thuốc',
  inpatient: 'Nội trú → Tab 5B Y lệnh',
};

export function DiagnosisScreen({
  onDiagnosed,
  record,
}: {
  onDiagnosed?: (treatmentType: TreatmentType) => void;
  record: MedicalRecordDetail;
}) {
  const alreadyDiagnosed = record.diagnosis !== null;
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIcd, setSelectedIcd] = useState<Icd10Entry | null>(null);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType | null>(null);
  const [pendingTreatmentType, setPendingTreatmentType] = useState<TreatmentType | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isClosed = record.status === 'closed';
  const { data: icdResults } = useIcd10Catalog(searchTerm);
  const { data: latestPrescription } = useLatestPrescription(
    record.recordId,
    alreadyDiagnosed && !isClosed,
  );
  const diagnose = useDiagnoseMedicalRecord(record.recordId);

  const isLocked =
    isClosed || (alreadyDiagnosed && Boolean(record.diagnosis?.treatmentType) && !isEditing);

  useEffect(() => {
    setIsEditing(false);
    setFieldErrors({});
    setErrorMessage(null);
    setPendingTreatmentType(null);
    if (record.diagnosis) {
      setSelectedIcd({
        code: record.diagnosis.icd10,
        name: '(mã đã lưu)',
        codingSystem: record.diagnosis.icdCodingSystem,
        effectiveFrom: '',
      });
      setDiagnosisText(record.diagnosis.diagnosisText);
      setTreatmentType(record.diagnosis.treatmentType);
    } else {
      setSelectedIcd(null);
      setDiagnosisText('');
      setTreatmentType(null);
    }
  }, [record.diagnosis, record.recordId]);

  /**
   * Cảnh báo trước khi đổi hướng điều trị có thể làm đơn thuốc đang hiệu lực
   * không còn phù hợp với hồ sơ. Backend vẫn kiểm tra lại điều kiện này để
   * tránh bỏ qua khi request được gửi trực tiếp.
   */
  function handleTreatmentTypeSelect(nextTreatmentType: TreatmentType) {
    const hasActivePrescription = latestPrescription?.hasActivePrescription === true;

    if (
      nextTreatmentType === 'inpatient' &&
      record.diagnosis?.treatmentType === 'outpatient' &&
      hasActivePrescription
    ) {
      setPendingTreatmentType(nextTreatmentType);
      return;
    }

    setTreatmentType(nextTreatmentType);
    setFieldErrors((current) => ({ ...current, treatmentType: '' }));
  }

  async function handleSubmit() {
    setErrorMessage(null);
    const nextErrors = {
      icd10: selectedIcd ? '' : 'Vui lòng chọn mã ICD-10.',
      diagnosisText:
        diagnosisText.trim().length === 0
          ? 'Vui lòng nhập diễn giải chẩn đoán.'
          : diagnosisText.length > 1000
            ? 'Diễn giải chẩn đoán không được vượt quá 1000 ký tự.'
            : '',
      treatmentType: treatmentType ? '' : 'Vui lòng chọn hướng điều trị Ngoại trú hoặc Nội trú.',
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !selectedIcd || !treatmentType) return;
    try {
      await diagnose.mutateAsync({
        expectedVersion: record.version,
        icd10: selectedIcd.code,
        diagnosisText,
        treatmentType,
      });
      setIsEditing(false);
      onDiagnosed?.(treatmentType);
    } catch (error) {
      setFieldErrors(getFieldErrorMap(error));
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể lưu chẩn đoán.');
    }
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold leading-[22.5px]">
          Chẩn đoán bệnh & Quyết định hướng điều trị
        </h2>
        <p className="text-xs leading-[18px] text-[#3f4851]">
          Chọn 1 mã ICD-10 (TT 06/2026/TT-BYT) làm <strong>chẩn đoán chính</strong> · Quyết định
          NGOẠI TRÚ (Tab 5A) hoặc NỘI TRÚ (Tab 5B).
        </p>
      </div>

      {isLocked && record.diagnosis && (
        <div
          className={cn(
            styles.alertSuccess,
            'mb-5 flex flex-wrap items-center justify-between gap-3',
          )}
        >
          <span>
            Đã lưu chẩn đoán — {record.diagnosis.icd10} ·{' '}
            {record.diagnosis.treatmentType
              ? PLAN_LABEL[record.diagnosis.treatmentType]
              : 'Chưa chọn hướng điều trị'}{' '}
            {new Date(record.diagnosis.diagnosedAt).toLocaleString('vi-VN')}
          </span>
          <button
            className="shrink-0 rounded-md border border-[#15803d] px-3 py-1.5 text-xs font-bold text-[#15803d] transition hover:bg-[#15803d]/10 focus:outline-none focus:ring-4 focus:ring-[#15803d]/15 active:scale-[0.98]"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Sửa lại
          </button>
        </div>
      )}
      {isClosed && (
        <p className={cn(styles.alertDanger, 'mb-5')}>
          Hồ sơ đã đóng, không thể chỉnh sửa chẩn đoán.
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>
              <AssetIcon className="h-4 w-4" name="icon-icd.svg" />
            </span>
            Mã bệnh ICD-10
          </h3>

          {!isLocked && (
            <div className="relative mt-6">
              <label className="block">
                <span className={styles.fieldLabel}>
                  Tìm mã ICD-10 <span className="text-[#ef4444]">*</span>
                </span>
                <span className="relative block">
                  <AssetIcon
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
                    name="icon-search.svg"
                  />
                  <input
                    className={styles.searchInputLg}
                    aria-invalid={Boolean(fieldErrors.icd10)}
                    onBlur={() => {
                      if (!selectedIcd)
                        setFieldErrors((current) => ({
                          ...current,
                          icd10: 'Vui lòng chọn mã ICD-10.',
                        }));
                    }}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setFieldErrors((current) => ({ ...current, icd10: '' }));
                    }}
                    placeholder="Mã hoặc tên bệnh (VD: L50, Mề đay...)"
                    value={searchTerm}
                  />
                </span>
                <span className="mt-2 block text-[11px] leading-[13.75px] text-[#707882]">
                  Gõ mã (L50) hoặc tên bệnh để tìm và chọn mã chẩn đoán chính.
                </span>
                <FieldError message={fieldErrors.icd10} />
              </label>
              {searchTerm && (icdResults?.length ?? 0) > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-[12px] border border-[#bfc7d2] bg-white shadow-lg">
                  {icdResults?.map((entry) => (
                    <button
                      className={styles.searchResultItem}
                      key={entry.code}
                      onClick={() => {
                        setSelectedIcd(entry);
                        setSearchTerm('');
                        setFieldErrors((current) => ({ ...current, icd10: '' }));
                      }}
                      type="button"
                    >
                      <span className="font-semibold text-[#171c1f]">{entry.code}</span>
                      <span className="text-[#3f4851]">{entry.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <p className={styles.fieldLabel}>Mã đã chọn</p>
            {selectedIcd ? (
              <span className="inline-flex items-center gap-2 rounded-md bg-[#006096] px-3 py-2 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,96,150,0.25)]">
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase">
                  Chính
                </span>
                {selectedIcd.code} {selectedIcd.name && `- ${selectedIcd.name}`}
                {!isLocked && (
                  <button
                    className="rounded-full p-0.5 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={() => {
                      setSelectedIcd(null);
                      setFieldErrors((current) => ({
                        ...current,
                        icd10: 'Vui lòng chọn mã ICD-10.',
                      }));
                    }}
                    type="button"
                  >
                    <AssetIcon className="h-3 w-3 brightness-0 invert" name="icon-close.svg" />
                  </button>
                )}
              </span>
            ) : (
              <span className="text-xs text-[#707882]">Chưa chọn mã ICD-10 chẩn đoán chính.</span>
            )}
          </div>

          <div className="mt-5">
            <label>
              <span className={styles.fieldLabel}>Diễn giải chẩn đoán chi tiết</span>
              <textarea
                className={cn(styles.textarea, fieldErrors.diagnosisText && 'border-[#ba1a1a]')}
                aria-invalid={Boolean(fieldErrors.diagnosisText)}
                maxLength={1000}
                onBlur={() => {
                  if (!diagnosisText.trim())
                    setFieldErrors((current) => ({
                      ...current,
                      diagnosisText: 'Vui lòng nhập diễn giải chẩn đoán.',
                    }));
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  setDiagnosisText(value);
                  setFieldErrors((current) => ({
                    ...current,
                    diagnosisText: value.trim() ? '' : current.diagnosisText,
                  }));
                }}
                placeholder="Triệu chứng lâm sàng đặc trưng, chẩn đoán phụ..."
                readOnly={isLocked}
                value={diagnosisText}
              />
              <div className="mt-1 flex justify-between gap-2 text-[11px] text-[#707882]">
                <FieldError message={fieldErrors.diagnosisText} />
                <span className="ml-auto">{diagnosisText.length}/1000</span>
              </div>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[#d4f0e0]">
              <AssetIcon className="h-5 w-5" name="icon-treatment.svg" />
            </span>
            Hướng điều trị
          </h3>
          <p className="mt-6 text-[11px] leading-[17.88px] text-[#707882]">
            {isLocked
              ? 'Hồ sơ đã được chẩn đoán và ký xác nhận.'
              : 'Chọn một hướng — hệ thống mở Tab 5A (đơn thuốc) hoặc Tab 5B (y lệnh nội trú) sau khi lưu.'}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TreatmentChoice
              active={treatmentType === 'outpatient'}
              description="Kê đơn thuốc điện tử, điều trị tại nhà (Tab 5A)"
              icon="icon-outpatient.svg"
              onClick={() => {
                if (!isLocked) {
                  handleTreatmentTypeSelect('outpatient');
                }
              }}
              title="Ngoại trú"
            />
            <TreatmentChoice
              active={treatmentType === 'inpatient'}
              description="Nhập viện, y lệnh hằng ngày & giường khoa (Tab 5B)"
              icon="icon-inpatient.svg"
              onClick={() => {
                if (!isLocked) {
                  handleTreatmentTypeSelect('inpatient');
                }
              }}
              title="Nội trú"
            />
          </div>

          <FieldError message={fieldErrors.treatmentType} />

          {!isLocked && (
            <button
              className={cn(
                styles.primaryButton,
                'mt-8 w-full rounded-[12px]',
                diagnose.isPending && 'opacity-60',
              )}
              disabled={
                diagnose.isPending ||
                isClosed ||
                !selectedIcd ||
                !diagnosisText.trim() ||
                !treatmentType ||
                Object.values(fieldErrors).some(Boolean)
              }
              onClick={handleSubmit}
              type="button"
            >
              {diagnose.isPending ? 'Đang lưu...' : 'Xác nhận & Lưu chẩn đoán'}
            </button>
          )}
        </section>
      </div>

      {pendingTreatmentType === 'inpatient' && (
        <div className={styles.modalOverlay}>
          <div
            aria-describedby="treatment-change-warning"
            aria-labelledby="treatment-change-title"
            aria-modal="true"
            className={cn(styles.modalCard, 'p-6')}
            role="dialog"
          >
            <h3 className="text-base font-bold text-[#171c1f]" id="treatment-change-title">
              Xác nhận đổi hướng điều trị
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#3f4851]" id="treatment-change-warning">
              Hồ sơ đang có đơn thuốc đã ký hoặc đã xuất XML. Đổi sang Nội trú có thể làm đơn thuốc
              hiện tại không còn phù hợp. Bạn vẫn muốn tiếp tục?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className={styles.secondaryButton}
                onClick={() => setPendingTreatmentType(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setTreatmentType('inpatient');
                  setPendingTreatmentType(null);
                  setFieldErrors((current) => ({ ...current, treatmentType: '' }));
                }}
                type="button"
              >
                Tiếp tục đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <DoctorFeedbackModal
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
          title="Không thể lưu chẩn đoán"
        />
      )}
    </section>
  );
}

function TreatmentChoice({
  active = false,
  description,
  icon,
  onClick,
  title,
}: {
  active?: boolean;
  description: string;
  icon: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className={cn(
        'relative min-h-[156px] rounded-[16px] border-2 p-5 text-left transition focus:outline-none focus:ring-4 focus:ring-[#006096]/15 active:scale-[0.99]',
        active
          ? 'border-[#006096] bg-[rgba(0,96,150,0.06)] shadow-[0_0_0_3px_rgba(0,96,150,0.12)]'
          : 'border-[#bfc7d2] bg-[#f0f4f8] hover:border-[#006096]/40 hover:bg-white',
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cee5ff]">
        <AssetIcon className="h-5 w-5" name={icon} />
      </span>
      <span className="mt-5 block text-[15px] font-extrabold uppercase leading-[22.5px]">
        {title}
      </span>
      <span className="mt-1 block text-xs leading-[16.5px] text-[#3f4851]">{description}</span>
      <span
        className={cn(
          'absolute right-4 top-4 h-5 w-5 rounded-full border-2',
          active ? 'border-[#006096] p-1' : 'border-[#bfc7d2]',
        )}
      >
        {active && <span className="block h-full w-full rounded-full bg-[#006096]" />}
      </span>
    </button>
  );
}
