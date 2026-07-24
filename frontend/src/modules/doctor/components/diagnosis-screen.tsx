'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { useDiagnoseMedicalRecord, useIcd10Catalog } from '../services/medical-record-api';
import type { Icd10Entry, MedicalRecordDetail, TreatmentType } from '../types/medical-record.types';
import { AssetIcon, cn } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

const PLAN_LABEL: Record<TreatmentType, string> = {
  outpatient: 'Ngoại trú → Tab 5A Đơn thuốc',
  inpatient: 'Nội trú → Tab 5B Y lệnh',
};

export function DiagnosisScreen({ record }: { record: MedicalRecordDetail }) {
  const alreadyDiagnosed = record.diagnosis !== null;
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIcd, setSelectedIcd] = useState<Icd10Entry | null>(null);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('outpatient');
  const [icdErrorVisible, setIcdErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: icdResults } = useIcd10Catalog(searchTerm);
  const diagnose = useDiagnoseMedicalRecord(record.recordId);

  const isLocked = alreadyDiagnosed && !isEditing;

  useEffect(() => {
    setIsEditing(false);
    setIcdErrorVisible(false);
    setErrorMessage(null);
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
      setTreatmentType('outpatient');
    }
  }, [record.diagnosis, record.recordId]);

  async function handleSubmit() {
    setErrorMessage(null);
    if (!selectedIcd) {
      setIcdErrorVisible(true);
      return;
    }
    setIcdErrorVisible(false);
    if (diagnosisText.trim().length === 0) {
      setErrorMessage('Vui lòng nhập diễn giải chẩn đoán.');
      return;
    }
    try {
      await diagnose.mutateAsync({
        expectedVersion: record.version,
        icd10: selectedIcd.code,
        diagnosisText,
        treatmentType,
      });
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể lưu chẩn đoán.');
    }
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold leading-[22.5px]">Chẩn đoán bệnh & Quyết định hướng điều trị</h2>
        <p className="text-xs leading-[18px] text-[#3f4851]">
          Chọn mã ICD-10 (TT 06/2026/TT-BYT) · Mã đầu tiên là <strong>bệnh chính</strong> · Quyết định NGOẠI TRÚ
          (Tab 5A) hoặc NỘI TRÚ (Tab 5B).
        </p>
      </div>

      {isLocked && record.diagnosis && (
        <div className={cn(styles.alertSuccess, 'mb-5 flex flex-wrap items-center justify-between gap-3')}>
          <span>
            Đã lưu chẩn đoán — {record.diagnosis.icd10} · {PLAN_LABEL[record.diagnosis.treatmentType]} ·{' '}
            {new Date(record.diagnosis.diagnosedAt).toLocaleString('vi-VN')}
          </span>
          <button
            className="shrink-0 rounded-md border border-[#15803d] px-3 py-1.5 text-xs font-bold text-[#15803d]"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Sửa lại
          </button>
        </div>
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
                  <AssetIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" name="icon-search.svg" />
                  <input
                    className="h-12 w-full rounded-[12px] border border-[#bfc7d2] bg-[#f0f4f8] pl-11 pr-4 text-[13.5px] outline-none"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Mã hoặc tên bệnh (VD: L50, Mề đay...)"
                    value={searchTerm}
                  />
                </span>
                <span className="mt-2 block text-[11px] leading-[13.75px] text-[#707882]">
                  Gõ mã (L50) hoặc tên bệnh. Có thể chọn mã; mã đầu = bệnh chính.
                </span>
                {icdErrorVisible && (
                  <span className="mt-1 block text-[11px] font-medium text-[#ba1a1a]">
                    Vui lòng chọn ít nhất 1 mã ICD-10 hợp lệ.
                  </span>
                )}
              </label>
              {searchTerm && (icdResults?.length ?? 0) > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-[12px] border border-[#bfc7d2] bg-white shadow-lg">
                  {icdResults?.map((entry) => (
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#f0f4f8]"
                      key={entry.code}
                      onClick={() => {
                        setSelectedIcd(entry);
                        setSearchTerm('');
                        setIcdErrorVisible(false);
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
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase">Chính</span>
                {selectedIcd.code} {selectedIcd.name && `- ${selectedIcd.name}`}
                {!isLocked && (
                  <button onClick={() => setSelectedIcd(null)} type="button">
                    <AssetIcon className="h-3 w-3 brightness-0 invert" name="icon-close.svg" />
                  </button>
                )}
              </span>
            ) : (
              <span className="text-xs text-[#707882]">Chưa chọn mã ICD-10 (mã đầu là bệnh chính).</span>
            )}
          </div>

          <div className="mt-5">
            <label>
              <span className={styles.fieldLabel}>Diễn giải chẩn đoán chi tiết</span>
              <textarea
                className={styles.textarea}
                onChange={(event) => setDiagnosisText(event.target.value)}
                placeholder="Triệu chứng lâm sàng đặc trưng, chẩn đoán phụ..."
                readOnly={isLocked}
                value={diagnosisText}
              />
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
              onClick={() => !isLocked && setTreatmentType('outpatient')}
              title="Ngoại trú"
            />
            <TreatmentChoice
              active={treatmentType === 'inpatient'}
              description="Nhập viện, y lệnh hằng ngày & giường khoa (Tab 5B)"
              icon="icon-inpatient.svg"
              onClick={() => !isLocked && setTreatmentType('inpatient')}
              title="Nội trú"
            />
          </div>

          {errorMessage && <p className={cn(styles.alertDanger, 'mt-4')}>{errorMessage}</p>}

          {!isLocked && (
            <button
              className={cn(styles.primaryButton, 'mt-8 w-full rounded-[12px]', diagnose.isPending && 'opacity-60')}
              disabled={diagnose.isPending}
              onClick={handleSubmit}
              type="button"
            >
              {diagnose.isPending ? 'Đang lưu...' : 'Xác nhận & Lưu chẩn đoán'}
            </button>
          )}
        </section>
      </div>
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
        'relative min-h-[156px] rounded-[16px] border-2 p-5 text-left transition focus:outline-none focus:ring-4 focus:ring-[#006096]/15',
        active ? 'border-[#006096] bg-[rgba(0,96,150,0.06)] shadow-[0_0_0_3px_rgba(0,96,150,0.12)]' : 'border-[#bfc7d2] bg-[#f0f4f8]',
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cee5ff]">
        <AssetIcon className="h-5 w-5" name={icon} />
      </span>
      <span className="mt-5 block text-[15px] font-extrabold uppercase leading-[22.5px]">{title}</span>
      <span className="mt-1 block text-xs leading-[16.5px] text-[#3f4851]">{description}</span>
      <span className={cn('absolute right-4 top-4 h-5 w-5 rounded-full border-2', active ? 'border-[#006096] p-1' : 'border-[#bfc7d2]')}>
        {active && <span className="block h-full w-full rounded-full bg-[#006096]" />}
      </span>
    </button>
  );
}
