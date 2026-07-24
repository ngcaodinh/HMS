'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import { useRecordVitalSigns, useUpdateClinicalAssessment } from '../services/medical-record-api';
import type { MedicalRecordDetail } from '../types/medical-record.types';
import { AssetIcon, cn } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

interface VitalsFormState {
  pulse: string;
  temperatureC: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  respiratoryRate: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
}

type FieldKey = keyof VitalsFormState | 'chiefComplaint';

function toFormState(record: MedicalRecordDetail): VitalsFormState {
  const vitals = record.latestVitalSigns;
  return {
    pulse: vitals?.pulse?.toString() ?? '',
    temperatureC: vitals?.temperatureC?.toString() ?? '',
    bloodPressureSystolic: vitals?.bloodPressureSystolic?.toString() ?? '',
    bloodPressureDiastolic: vitals?.bloodPressureDiastolic?.toString() ?? '',
    respiratoryRate: vitals?.respiratoryRate?.toString() ?? '',
    spo2: vitals?.spo2?.toString() ?? '',
    weightKg: vitals?.weightKg?.toString() ?? record.clinicalAssessment.weightKg ?? '',
    heightCm: record.clinicalAssessment.heightCm ?? '',
  };
}

/** Soft clinical-plausibility ranges — mirrors `validateVitalsBlur()` in Tailieu/doctor.html. */
function validateField(field: FieldKey, rawValue: string): string {
  const value = rawValue.trim();
  const num = Number(value);
  if (field === 'pulse' && value && (num < 30 || num > 220)) return 'Mạch thường 30–220 bpm.';
  if (field === 'temperatureC' && value && (num < 34 || num > 43)) return 'Nhiệt độ hợp lệ khoảng 34–43 °C.';
  if (field === 'bloodPressureSystolic' && value && (num < 50 || num > 280)) return 'Huyết áp tâm thu không hợp lệ.';
  if (field === 'bloodPressureDiastolic' && value && (num < 20 || num > 180)) return 'Huyết áp tâm trương không hợp lệ.';
  if (field === 'spo2' && value && (num < 50 || num > 100)) return 'SpO2 trong khoảng 50–100%.';
  if (field === 'weightKg' && value && (num < 1 || num > 300)) return 'Cân nặng không hợp lệ.';
  if (field === 'heightCm' && value && (num < 40 || num > 250)) return 'Chiều cao không hợp lệ.';
  if (field === 'chiefComplaint' && !value) return 'Nên ghi lý do khám bệnh.';
  return '';
}

function computeBmi(weightKg: string, heightCm: string): { value: string; label: string; tone: string } | null {
  const weight = Number(weightKg);
  const height = Number(heightCm) / 100;
  if (!weight || !height) return null;
  const bmi = weight / (height * height);
  const value = (Math.round(bmi * 10) / 10).toFixed(1);
  if (bmi < 18.5) return { value, label: 'Thiếu cân', tone: 'text-[#a05c00]' };
  if (bmi < 25) return { value, label: 'Bình thường', tone: 'text-[#1b6e3f]' };
  if (bmi < 30) return { value, label: 'Thừa cân', tone: 'text-[#a05c00]' };
  return { value, label: 'Béo phì', tone: 'text-[#ba1a1a]' };
}

const VITAL_FIELDS: Array<{ key: keyof VitalsFormState; label: string; unit: string; min: number; max: number; step?: string }> = [
  { key: 'pulse', label: 'Mạch', unit: 'bpm', min: 0, max: 250 },
  { key: 'temperatureC', label: 'Nhiệt độ', unit: '°C', min: 30, max: 45, step: '0.1' },
  { key: 'bloodPressureSystolic', label: 'HA tâm thu', unit: 'mmHg', min: 40, max: 300 },
  { key: 'bloodPressureDiastolic', label: 'HA tâm trương', unit: 'mmHg', min: 20, max: 200 },
  { key: 'respiratoryRate', label: 'Nhịp thở', unit: 'l/ph', min: 0, max: 80 },
  { key: 'spo2', label: 'SpO2', unit: '%', min: 0, max: 100 },
  { key: 'weightKg', label: 'Cân nặng', unit: 'kg', min: 1, max: 300, step: '0.1' },
  { key: 'heightCm', label: 'Chiều cao', unit: 'cm', min: 40, max: 250, step: '0.1' },
];

export function VitalsScreen({ doctorName, record }: { doctorName: string; record: MedicalRecordDetail }) {
  const [form, setForm] = useState<VitalsFormState>(() => toFormState(record));
  const [chiefComplaint, setChiefComplaint] = useState(record.chiefComplaint ?? '');
  const [history, setHistory] = useState(record.clinicalAssessment.historyOfPresentIllness ?? '');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [isLocked, setIsLocked] = useState(() => record.latestVitalSigns !== null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recordVitals = useRecordVitalSigns(record.recordId);
  const updateAssessment = useUpdateClinicalAssessment(record.recordId);

  useEffect(() => {
    setForm(toFormState(record));
    setChiefComplaint(record.chiefComplaint ?? '');
    setHistory(record.clinicalAssessment.historyOfPresentIllness ?? '');
    setIsLocked(record.latestVitalSigns !== null);
    setFieldErrors({});
  }, [record]);

  const bmi = computeBmi(form.weightKg, form.heightCm);

  function updateField(field: keyof VitalsFormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function handleBlur(field: FieldKey, value: string) {
    setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) }));
  }

  async function handleSave() {
    if (isLocked) {
      setIsLocked(false);
      return;
    }

    const nextErrors: Partial<Record<FieldKey, string>> = {};
    for (const field of VITAL_FIELDS) nextErrors[field.key] = validateField(field.key, form[field.key]);
    nextErrors.chiefComplaint = validateField('chiefComplaint', chiefComplaint);
    setFieldErrors(nextErrors);

    const hasBlockingError = Object.values(nextErrors).some((message) => message);
    if (hasBlockingError) {
      setErrorMessage('Kiểm tra lại các trường sinh hiệu / lý do khám.');
      return;
    }

    setErrorMessage(null);
    try {
      await recordVitals.mutateAsync({
        pulse: Number(form.pulse),
        temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
        bloodPressureSystolic: Number(form.bloodPressureSystolic),
        bloodPressureDiastolic: Number(form.bloodPressureDiastolic),
        respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : undefined,
        spo2: Number(form.spo2),
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      });
      await updateAssessment.mutateAsync({
        expectedVersion: record.version,
        chiefComplaint,
        historyOfPresentIllness: history,
      });
      setIsLocked(true);
      setConfirmedAt(new Date().toLocaleTimeString('vi-VN'));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể lưu thông tin khám.');
    }
  }

  const isSaving = recordVitals.isPending || updateAssessment.isPending;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <AssetIcon className="h-[18px] w-[18px]" name="icon-save.svg" />
          </span>
          Chỉ số sinh hiệu
        </h2>
        <fieldset className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" disabled={isLocked}>
          {VITAL_FIELDS.map((field) => (
            <label key={field.key}>
              <span className={styles.fieldLabel}>{field.label}</span>
              <span className="relative block">
                <input
                  className={cn(styles.input, 'pr-14', fieldErrors[field.key] && 'border-[#ba1a1a]')}
                  max={field.max}
                  min={field.min}
                  onBlur={(event) => handleBlur(field.key, event.target.value)}
                  onChange={updateField(field.key)}
                  step={field.step}
                  type="number"
                  value={form[field.key]}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#707882]">
                  {field.unit}
                </span>
              </span>
              {fieldErrors[field.key] && <span className="mt-1 block text-[11px] text-[#ba1a1a]">{fieldErrors[field.key]}</span>}
            </label>
          ))}
          <label>
            <span className={styles.fieldLabel}>BMI</span>
            <span className={cn(styles.input, 'flex items-center justify-between bg-[#eaeef2]')}>
              <span className="text-base font-bold text-[#006096]">{bmi?.value ?? '—'}</span>
              <span className={cn('text-[11px] font-semibold', bmi?.tone ?? 'text-[#707882]')}>{bmi?.label ?? 'Nhập cân / cao'}</span>
            </span>
          </label>
        </fieldset>
        {isLocked && confirmedAt && (
          <p className="mt-4 rounded-md bg-[#d4f0e0] px-3 py-2 text-xs font-semibold text-[#1b6e3f]">
            ✓ Đã xác nhận sinh hiệu — {doctorName} · {confirmedAt}
          </p>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <AssetIcon className="h-[18px] w-[18px]" name="icon-clinical.svg" />
          </span>
          Bệnh sử & khám lâm sàng
        </h2>
        <fieldset className="mt-5 space-y-4" disabled={isLocked}>
          <label>
            <span className={styles.fieldLabel}>Lý do khám bệnh</span>
            <input
              className={cn(styles.input, fieldErrors.chiefComplaint && 'border-[#ba1a1a]')}
              onBlur={(event) => handleBlur('chiefComplaint', event.target.value)}
              onChange={(event) => setChiefComplaint(event.target.value)}
              value={chiefComplaint}
            />
            {fieldErrors.chiefComplaint && <span className="mt-1 block text-[11px] text-[#ba1a1a]">{fieldErrors.chiefComplaint}</span>}
          </label>
          <label>
            <span className={styles.fieldLabel}>Bệnh sử lâm sàng</span>
            <textarea className={styles.textarea} onChange={(event) => setHistory(event.target.value)} value={history} />
          </label>
          {record.patient.allergies && (
            <p className="rounded-md border border-[#bfc7d2] bg-[#ffdad6] px-3 py-3 text-[11px] font-semibold text-[#ba1a1a]">
              <strong>Dị ứng đã ghi nhận:</strong> {record.patient.allergies}
            </p>
          )}
        </fieldset>
      </section>

      {errorMessage && <p className={cn(styles.alertDanger, 'xl:col-span-2')}>{errorMessage}</p>}

      <div className="flex justify-end xl:col-span-2">
        <button
          className={cn(isLocked ? styles.secondaryButton : styles.primaryButton, isSaving && 'opacity-60')}
          disabled={isSaving}
          onClick={handleSave}
          type="button"
        >
          {isLocked ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          ) : (
            <AssetIcon className="h-4 w-4 brightness-0 invert" name="icon-save.svg" />
          )}
          {isSaving ? 'Đang lưu...' : isLocked ? 'Mở khóa để chỉnh sửa' : 'Lưu thông tin khám'}
        </button>
      </div>
    </div>
  );
}
