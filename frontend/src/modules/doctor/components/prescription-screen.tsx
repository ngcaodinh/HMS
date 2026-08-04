'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/shared/api-client';
import {
  useCancelPrescription,
  useCreatePrescriptionDraft,
  useExportPrescriptionXml,
  useLatestPrescription,
  useMedicines,
  useSignPrescription,
} from '../services/prescription-api';
import type { DraftRxLine, MedicineOption, PrescriptionItem } from '../types/prescription.types';
import type { MedicalRecordDetail } from '../types/medical-record.types';
import { DoctorFeedbackModal } from './doctor-feedback-modal';
import { resetDraftForNoDrug } from './prescription-draft-helpers';
import { AssetIcon, cn } from './shared';
import { FieldError, getFieldErrorMap } from './field-error';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

const MIN_OVERRIDE_REASON_LENGTH = 15;
type LineErrorField = 'quantity' | 'days' | 'dosage';

function lineErrorKey(medicineId: string, field: LineErrorField): string {
  return `${medicineId}.${field}`;
}

/** Kiểm tra số nguyên dương của từng dòng ngay khi người dùng thay đổi ô số. */
function validateLineNumber(value: string, field: 'quantity' | 'days'): string {
  const label = field === 'quantity' ? 'Số lượng' : 'Số ngày dùng';
  if (!value.trim()) return `${label} không được để trống.`;

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return `${label} phải là số nguyên dương.`;
  if (field === 'days' && number > 90) return 'Số ngày dùng tối đa là 90 ngày.';
  return '';
}

/** Chuẩn hóa lỗi nghiệp vụ kê đơn để bác sĩ biết vì sao hồ sơ chưa đi đúng luồng. */
function getPrescriptionErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === 'RECORD_NOT_OUTPATIENT') {
    return 'Hồ sơ chưa được chẩn đoán hướng điều trị ngoại trú, không thể kê đơn.';
  }
  return error.message;
}

function checkAllergyConflict(
  medicine: MedicineOption,
  patientAllergies: string | null,
): string | null {
  if (!patientAllergies?.trim()) return null;
  const tokens = patientAllergies
    .split(/[,;\n]/)
    .map((token) => token.trim())
    .filter(Boolean);
  const active = (medicine.activeIngredient ?? '').toLowerCase();
  const firstWord = active.split(' ')[0] ?? '';
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (active && (active.includes(lower) || (firstWord && lower.includes(firstWord))))
      return token;
  }
  const hasPenicillinAllergy = tokens.some((token) => token.toLowerCase().includes('penicillin'));
  if (
    hasPenicillinAllergy &&
    /penicillin|amoxicillin|ampicillin/i.test(`${active} ${medicine.name}`)
  )
    return 'Penicillin';
  return null;
}

function newLine(medicine: MedicineOption): DraftRxLine {
  return {
    medicineId: medicine.medicineId,
    name: medicine.name,
    activeIngredient: medicine.activeIngredient,
    quantity: '10',
    days: '5',
    dosePerUse: '1 viên/ngày',
    useTiming: 'Theo chỉ định',
  };
}

export function PrescriptionScreen({ record }: { record: MedicalRecordDetail }) {
  const { data: latest, isLoading: isLatestLoading } = useLatestPrescription(record.recordId, true);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: medicineResults } = useMedicines(searchTerm);
  const [lines, setLines] = useState<DraftRxLine[]>([]);
  const [noDrug, setNoDrug] = useState(false);
  const [chronic, setChronic] = useState(false);
  const [chronicReason, setChronicReason] = useState('');
  const [allergyOverrideReason, setAllergyOverrideReason] = useState<string | null>(null);
  const [pendingAllergyDrug, setPendingAllergyDrug] = useState<MedicineOption | null>(null);
  const [allergyReasonInput, setAllergyReasonInput] = useState('');
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const createDraft = useCreatePrescriptionDraft(record.recordId);
  const signPrescription = useSignPrescription(record.recordId);
  const cancelPrescription = useCancelPrescription(record.recordId);
  const exportXml = useExportPrescriptionXml(record.recordId);

  useEffect(() => {
    setLines([]);
    setNoDrug(false);
    setChronic(false);
    setChronicReason('');
    setAllergyOverrideReason(null);
    setLineErrors({});
    setErrorMessage(null);
  }, [record.recordId]);

  const latestPrescription = latest?.prescription;
  const isLocalPhase = !latestPrescription || latestPrescription.status === 'cancelled';
  const isSigned =
    latestPrescription?.status === 'active' || latestPrescription?.status === 'xml_exported';
  const isClosed = record.status === 'closed';
  const serverItems: PrescriptionItem[] = latestPrescription?.items ?? [];
  const maxDays = Math.max(0, ...lines.map((line) => Number(line.days) || 0));
  const isBusy =
    createDraft.isPending ||
    signPrescription.isPending ||
    cancelPrescription.isPending ||
    exportXml.isPending;

  function addDrug(medicine: MedicineOption) {
    if (isClosed) return;
    setErrorMessage(null);
    if (noDrug) {
      setErrorMessage('Đang chọn «Không dùng thuốc» — bỏ chọn trước khi kê toa.');
      return;
    }
    if (lines.some((line) => line.medicineId === medicine.medicineId)) {
      setErrorMessage('Thuốc đã có trong đơn.');
      return;
    }
    const conflict = checkAllergyConflict(medicine, record.patient.allergies);
    if (conflict) {
      setPendingAllergyDrug(medicine);
      setAllergyReasonInput('');
      setSearchTerm('');
      return;
    }
    setLines((current) => [...current, newLine(medicine)]);
    setLineErrors((current) => ({ ...current, [medicine.medicineId]: '' }));
    setSearchTerm('');
  }

  function confirmAllergyOverride() {
    if (!pendingAllergyDrug || allergyReasonInput.trim().length < MIN_OVERRIDE_REASON_LENGTH)
      return;
    setAllergyOverrideReason(allergyReasonInput.trim());
    setLines((current) => [...current, newLine(pendingAllergyDrug)]);
    setLineErrors((current) => ({ ...current, [pendingAllergyDrug.medicineId]: '' }));
    setPendingAllergyDrug(null);
  }

  function toggleNoDrug(checked: boolean) {
    if (checked) {
      const resetState = resetDraftForNoDrug();
      setLines(resetState.lines);
      setLineErrors(resetState.lineErrors);
      setAllergyOverrideReason(resetState.allergyOverrideReason);
    }
    setNoDrug(checked);
  }

  const durationInvalid =
    maxDays > 90 ||
    (maxDays > 30 && (!chronic || chronicReason.trim().length < MIN_OVERRIDE_REASON_LENGTH));
  const hasLineErrors = Object.values(lineErrors).some(Boolean);

  /** Cập nhật một dòng thuốc và báo ngay nếu thiếu liều dùng hoặc thời điểm dùng. */
  function updateLine(line: DraftRxLine, field: 'dosePerUse' | 'useTiming', value: string) {
    setLines((current) =>
      current.map((entry) =>
        entry.medicineId === line.medicineId ? { ...entry, [field]: value } : entry,
      ),
    );
    const otherField = field === 'dosePerUse' ? line.useTiming : line.dosePerUse;
    setLineErrors((current) => ({
      ...current,
      [lineErrorKey(line.medicineId, 'dosage')]:
        otherField.trim() && value.trim() ? '' : 'Liều dùng và thời điểm dùng không được để trống.',
    }));
  }

  function updateNumericLine(line: DraftRxLine, field: 'quantity' | 'days', value: string) {
    setLines((current) =>
      current.map((entry) =>
        entry.medicineId === line.medicineId ? { ...entry, [field]: value } : entry,
      ),
    );
    setLineErrors((current) => ({
      ...current,
      [lineErrorKey(line.medicineId, field)]: validateLineNumber(value, field),
    }));
  }

  /** Kiểm tra toàn bộ dòng trước submit để không đợi backend trả lỗi mới hiện tại form. */
  function validateDraftLines(): Record<string, string> {
    if (noDrug) return {};
    const nextErrors: Record<string, string> = {};
    for (const line of lines) {
      const quantityError = validateLineNumber(line.quantity, 'quantity');
      const daysError = validateLineNumber(line.days, 'days');
      const dosageError =
        line.dosePerUse.trim() && line.useTiming.trim()
          ? ''
          : 'Liều dùng và thời điểm dùng không được để trống.';
      if (quantityError) nextErrors[lineErrorKey(line.medicineId, 'quantity')] = quantityError;
      if (daysError) nextErrors[lineErrorKey(line.medicineId, 'days')] = daysError;
      if (dosageError) nextErrors[lineErrorKey(line.medicineId, 'dosage')] = dosageError;
    }
    return nextErrors;
  }

  async function submitDraft(signAfter: boolean) {
    if (isClosed) return;
    setErrorMessage(null);
    const nextLineErrors = validateDraftLines();
    setLineErrors(nextLineErrors);
    if (Object.values(nextLineErrors).some(Boolean)) return;
    if (!noDrug && lines.length === 0) {
      setErrorMessage('Đơn trống — kê ít nhất một thuốc hoặc chọn «Không dùng thuốc».');
      return;
    }
    if (!noDrug && durationInvalid) {
      setErrorMessage('Số ngày thuốc vượt giới hạn — kiểm tra cờ bệnh mãn tính / lý do.');
      return;
    }
    try {
      const draft = await createDraft.mutateAsync({
        expectedRecordVersion: record.version,
        items: noDrug
          ? []
          : lines.map((line) => ({
              medicineId: line.medicineId,
              quantity: Number(line.quantity),
              days: Number(line.days),
              dosePerUse: line.dosePerUse,
              useTiming: line.useTiming,
              dosageInstruction: `${line.dosePerUse}, ${line.useTiming}`,
            })),
        noDrugConfirmation: noDrug || undefined,
        longTermReason: maxDays > 30 ? chronicReason : undefined,
        allergyOverrideReason: allergyOverrideReason ?? undefined,
      });
      if (signAfter) {
        await signPrescription.mutateAsync({
          prescriptionId: draft.prescriptionId,
          expectedVersion: draft.version,
        });
      }
    } catch (error) {
      const fieldErrors = getFieldErrorMap(error);
      const itemErrors = Object.entries(fieldErrors).reduce<Record<string, string>>(
        (current, [field, message]) => {
          const index = Number(field.match(/^items\.(\d+)/)?.[1]);
          const line = Number.isInteger(index) ? lines[index] : undefined;
          if (line) {
            const fieldName = field.endsWith('.quantity')
              ? 'quantity'
              : field.endsWith('.days')
                ? 'days'
                : 'dosage';
            current[lineErrorKey(line.medicineId, fieldName)] = message;
          }
          return current;
        },
        {},
      );
      setLineErrors(itemErrors);
      setErrorMessage(getPrescriptionErrorMessage(error, 'Không thể lưu đơn thuốc.'));
    }
  }

  async function handleSign() {
    if (isClosed) return;
    if (latestPrescription?.status === 'draft') {
      try {
        await signPrescription.mutateAsync({
          prescriptionId: latestPrescription.prescriptionId,
          expectedVersion: latestPrescription.version,
          allergyOverrideReason: allergyOverrideReason ?? undefined,
        });
      } catch (error) {
        setErrorMessage(getPrescriptionErrorMessage(error, 'Không thể ký đơn thuốc.'));
      }
      return;
    }
    await submitDraft(true);
  }

  async function handleCancelDraft() {
    if (!latestPrescription || isClosed) return;
    try {
      await cancelPrescription.mutateAsync({
        prescriptionId: latestPrescription.prescriptionId,
        expectedVersion: latestPrescription.version,
        cancelReason: 'Bác sĩ hủy đơn nháp để kê lại.',
      });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể hủy đơn nháp.');
    }
  }

  async function handleCancelSigned() {
    if (!latestPrescription || isClosed || cancelReason.trim().length === 0) return;
    try {
      await cancelPrescription.mutateAsync({
        prescriptionId: latestPrescription.prescriptionId,
        expectedVersion: latestPrescription.version,
        cancelReason,
      });
      setIsCancelModalOpen(false);
      setCancelReason('');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể hủy đơn thuốc.');
    }
  }

  async function handleXml() {
    if (!latestPrescription || isClosed) return;
    setErrorMessage(null);
    try {
      if (latestPrescription.status === 'active') {
        await exportXml.mutateAsync({
          prescriptionId: latestPrescription.prescriptionId,
          expectedVersion: latestPrescription.version,
        });
      }
      window.open(
        `/api/proxy/prescriptions/${latestPrescription.prescriptionId}/xml-file`,
        '_blank',
      );
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể xuất XML đơn thuốc.');
    }
  }

  if (isLatestLoading) {
    return (
      <section className={styles.card}>
        <p className="text-sm text-[#707882]">Đang tải đơn thuốc...</p>
      </section>
    );
  }

  return (
    <section>
      {isSigned && latestPrescription && (
        <div className="mb-4 flex items-center gap-3 rounded-[12px] border-2 border-[#ba1a1a] bg-[#ffdad6] px-4 py-3 text-[#ba1a1a]">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <div className="text-sm font-extrabold tracking-wide">「Đã ký」</div>
            <div className="text-[13px] font-semibold">
              {latestPrescription.signedAt &&
                new Date(latestPrescription.signedAt).toLocaleString('vi-VN')}
              {serverItems.length === 0 && ' · Không dùng thuốc'}
            </div>
          </div>
        </div>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#cee5ff]">
            <AssetIcon className="h-5 w-5" name="icon-outpatient.svg" />
          </span>
          Kê đơn thuốc ngoại trú điện tử
        </h2>

        {isClosed && (
          <p className={cn(styles.alertDanger, 'mt-4')}>
            Hồ sơ đã đóng, không thể chỉnh sửa đơn thuốc.
          </p>
        )}

        {isLocalPhase && !noDrug && (
          <div className="relative mt-6">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.3px] text-[#707882]">
                Tìm thuốc / hoạt chất
              </span>
              <span className="relative block">
                <AssetIcon
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
                  name="icon-search.svg"
                />
                <input
                  className={styles.searchInputLg}
                  disabled={isClosed}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="VD: Fexofenadine, Amoxicillin..."
                  value={searchTerm}
                />
              </span>
            </label>
            {searchTerm && (medicineResults?.length ?? 0) > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-[12px] border border-[#bfc7d2] bg-white shadow-lg">
                {medicineResults?.map((medicine) => (
                  <button
                    className={styles.searchResultItem}
                    disabled={isClosed}
                    key={medicine.medicineId}
                    onClick={() => addDrug(medicine)}
                    type="button"
                  >
                    <span>
                      <span className="block font-semibold text-[#171c1f]">{medicine.name}</span>
                      <span className="block text-xs text-[#707882]">
                        Hoạt chất: {medicine.activeIngredient ?? '—'}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-[#006096]">
                      {Number(medicine.unitPrice).toLocaleString('vi-VN')}đ
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>STT</th>
                  <th className={styles.th}>Tên thuốc &amp; hoạt chất</th>
                  <th className={styles.th}>SL</th>
                  <th className={styles.th}>Số ngày</th>
                  <th className={styles.th}>Liều dùng</th>
                  <th className={styles.th}>Cách dùng</th>
                  {isLocalPhase && <th className={styles.th} />}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7] bg-white">
                {isLocalPhase && noDrug && (
                  <tr>
                    <td className="px-4 py-5 text-center text-sm text-[#707882]" colSpan={7}>
                      Đã chọn <strong>Không dùng thuốc</strong> — không kê dòng thuốc.
                    </td>
                  </tr>
                )}
                {isLocalPhase && !noDrug && lines.length === 0 && (
                  <tr>
                    <td className="px-4 py-5 text-center text-sm text-[#707882]" colSpan={7}>
                      Chưa kê thuốc. Tìm và thêm từ ô tìm kiếm, hoặc chọn «Không dùng thuốc».
                    </td>
                  </tr>
                )}
                {isLocalPhase &&
                  !noDrug &&
                  lines.map((line, index) => (
                    <tr className={styles.tableRow} key={line.medicineId}>
                      <td className={styles.td}>{index + 1}</td>
                      <td className={cn(styles.td, 'font-bold text-[#001d32]')}>
                        {line.name}
                        <br />
                        <span className="text-[11px] font-normal text-[#707882]">
                          Hoạt chất: {line.activeIngredient ?? '—'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <input
                          className={cn(
                            'w-16 rounded-md border border-[#bfc7d2] px-2 py-1 text-center tabular-nums',
                            lineErrors[lineErrorKey(line.medicineId, 'quantity')] &&
                              'border-[#ba1a1a]',
                          )}
                          min={1}
                          onChange={(event) =>
                            updateNumericLine(line, 'quantity', event.target.value)
                          }
                          type="number"
                          value={line.quantity}
                        />
                        <FieldError
                          message={lineErrors[lineErrorKey(line.medicineId, 'quantity')]}
                        />
                      </td>
                      <td className={styles.td}>
                        <input
                          className={cn(
                            'w-16 rounded-md border border-[#bfc7d2] px-2 py-1 text-center tabular-nums',
                            lineErrors[lineErrorKey(line.medicineId, 'days')] && 'border-[#ba1a1a]',
                          )}
                          max={90}
                          min={1}
                          onChange={(event) => updateNumericLine(line, 'days', event.target.value)}
                          type="number"
                          value={line.days}
                        />
                        <FieldError message={lineErrors[lineErrorKey(line.medicineId, 'days')]} />
                      </td>
                      <td className={styles.td}>
                        <input
                          className={cn(
                            'w-32 rounded-md border border-[#bfc7d2] px-2 py-1',
                            lineErrors[lineErrorKey(line.medicineId, 'dosage')] &&
                              'border-[#ba1a1a]',
                          )}
                          onChange={(event) => updateLine(line, 'dosePerUse', event.target.value)}
                          value={line.dosePerUse}
                        />
                        <FieldError message={lineErrors[lineErrorKey(line.medicineId, 'dosage')]} />
                      </td>
                      <td className={styles.td}>
                        <input
                          className={cn(
                            'w-32 rounded-md border border-[#bfc7d2] px-2 py-1',
                            lineErrors[lineErrorKey(line.medicineId, 'dosage')] &&
                              'border-[#ba1a1a]',
                          )}
                          onChange={(event) => updateLine(line, 'useTiming', event.target.value)}
                          value={line.useTiming}
                        />
                      </td>
                      <td className={styles.td}>
                        <button
                          className={styles.dangerLink}
                          onClick={() => {
                            setLines((current) =>
                              current.filter((l) => l.medicineId !== line.medicineId),
                            );
                            setLineErrors((current) => {
                              const next = { ...current };
                              for (const key of Object.keys(next)) {
                                if (key.startsWith(`${line.medicineId}.`)) delete next[key];
                              }
                              return next;
                            });
                          }}
                          type="button"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                {!isLocalPhase &&
                  serverItems.map((item, index) => (
                    <tr className={styles.tableRow} key={item.prescriptionItemId}>
                      <td className={styles.td}>{index + 1}</td>
                      <td className={cn(styles.td, 'font-bold text-[#001d32]')}>
                        {item.medicineNameSnapshot}
                        <br />
                        <span className="text-[11px] font-normal text-[#707882]">
                          Hoạt chất: {item.activeIngredientSnapshot ?? '—'}
                        </span>
                      </td>
                      <td className={cn(styles.td, 'tabular-nums')}>{item.quantity}</td>
                      <td className={cn(styles.td, 'tabular-nums')}>{item.days}</td>
                      <td className={styles.td}>{item.dosePerUse}</td>
                      <td className={styles.td}>{item.useTiming}</td>
                    </tr>
                  ))}
                {!isLocalPhase && serverItems.length === 0 && (
                  <tr>
                    <td className="px-4 py-5 text-center text-sm text-[#707882]" colSpan={6}>
                      Đơn <strong>Không dùng thuốc</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isLocalPhase && (
          <>
            <div className="mt-5 flex items-center gap-2 rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-4 py-3">
              <input
                checked={noDrug}
                className="h-4 w-4"
                disabled={isClosed}
                id="rx-no-drug"
                onChange={(event) => toggleNoDrug(event.target.checked)}
                type="checkbox"
              />
              <label className="text-sm" htmlFor="rx-no-drug">
                Xác nhận <strong>Không dùng thuốc</strong> (đơn rỗng hợp lệ theo TT 26/2025)
              </label>
            </div>

            {maxDays > 30 && (
              <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-4 py-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={chronic}
                    className="h-4 w-4"
                    disabled={isClosed}
                    onChange={(event) => setChronic(event.target.checked)}
                    type="checkbox"
                  />
                  Điều trị bệnh mãn tính (cho phép kê tối đa 90 ngày)
                </label>
                <input
                  className="min-w-[220px] flex-1 rounded-md border border-[#bfc7d2] px-3 py-2 text-sm"
                  disabled={!chronic || isClosed}
                  onChange={(event) => setChronicReason(event.target.value)}
                  placeholder="Lý do chuyên môn (bắt buộc khi số ngày > 30)"
                  value={chronicReason}
                />
              </div>
            )}
            {durationInvalid && (
              <p className={cn(styles.alertDanger, 'mt-3')}>
                Số ngày thuốc vượt giới hạn — tick xác nhận mãn tính và nhập lý do ≥ 15 ký tự để kê
                quá 30 ngày.
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#bfc7d2] pt-4">
          {isLocalPhase && (
            <>
              <button
                className={cn(
                  styles.mutedButton,
                  (isBusy ||
                    isClosed ||
                    durationInvalid ||
                    hasLineErrors ||
                    (!noDrug && lines.length === 0)) &&
                    'opacity-60',
                )}
                disabled={
                  isBusy ||
                  isClosed ||
                  durationInvalid ||
                  hasLineErrors ||
                  (!noDrug && lines.length === 0)
                }
                onClick={() => submitDraft(false)}
                type="button"
              >
                Lưu nháp
              </button>
              <button
                className={cn(
                  styles.primaryButton,
                  (isBusy ||
                    isClosed ||
                    durationInvalid ||
                    hasLineErrors ||
                    (!noDrug && lines.length === 0)) &&
                    'opacity-60',
                )}
                disabled={
                  isBusy ||
                  isClosed ||
                  durationInvalid ||
                  hasLineErrors ||
                  (!noDrug && lines.length === 0)
                }
                onClick={handleSign}
                type="button"
              >
                {isBusy ? 'Đang xử lý...' : 'XÁC NHẬN KÝ ĐƠN THUỐC'}
              </button>
            </>
          )}
          {latestPrescription?.status === 'draft' && (
            <>
              <button
                className={styles.mutedButton}
                disabled={isBusy || isClosed}
                onClick={handleCancelDraft}
                type="button"
              >
                Hủy đơn nháp
              </button>
              <button
                className={styles.primaryButton}
                disabled={isBusy || isClosed}
                onClick={handleSign}
                type="button"
              >
                {isBusy ? 'Đang xử lý...' : 'XÁC NHẬN KÝ ĐƠN THUỐC'}
              </button>
            </>
          )}
          {isSigned && (
            <button
              className="rounded-md border border-[#ba1a1a] px-4 py-2 text-xs font-bold text-[#ba1a1a] transition hover:bg-[#ffdad6] focus:outline-none focus:ring-4 focus:ring-[#ba1a1a]/15 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              disabled={isBusy || isClosed}
              onClick={() => setIsCancelModalOpen(true)}
              type="button"
            >
              Hủy đơn thuốc đã ký
            </button>
          )}
        </div>

        {errorMessage && (
          <DoctorFeedbackModal
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
            title="Không thể xử lý đơn thuốc"
          />
        )}

        {isSigned && latestPrescription && (
          <div
            className={cn(
              styles.alertInfo,
              'mt-4 flex flex-wrap items-center justify-between gap-3',
            )}
          >
            <span>
              {latestPrescription.xmlExportedAt
                ? `Đã xuất XML lúc ${new Date(latestPrescription.xmlExportedAt).toLocaleString('vi-VN')}.`
                : 'Đơn đã ký — bấm để kết xuất XML đơn thuốc điện tử.'}
            </span>
            <button
              className={styles.mutedButton}
              disabled={isBusy || isClosed}
              onClick={handleXml}
              type="button"
            >
              Tải XML đơn thuốc
            </button>
          </div>
        )}
      </section>

      {pendingAllergyDrug && (
        <div className={cn(styles.modalOverlay, 'animate-fadeIn backdrop-blur-[2px]')}>
          <div className={cn(styles.modalCard, 'animate-modalIn')}>
            <div className={styles.modalDangerHeader}>
              <p className="flex items-center gap-2 text-sm font-extrabold text-[#ba1a1a]">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                Cảnh báo trùng dị ứng
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-[#3f4851]">
                Thuốc <strong>{pendingAllergyDrug.name}</strong> (hoạt chất{' '}
                <strong>{pendingAllergyDrug.activeIngredient ?? '—'}</strong>) trùng dị ứng đã ghi
                nhận trên hồ sơ bệnh nhân: <strong>{record.patient.allergies}</strong>.
              </p>
              <label className="mt-4 block">
                <span className={styles.fieldLabel}>
                  Lý do chuyên môn ghi đè <span className="text-[#ef4444]">*</span> (tối thiểu 15 ký
                  tự)
                </span>
                <textarea
                  className={styles.textarea}
                  onChange={(event) => setAllergyReasonInput(event.target.value)}
                  placeholder="Nhập lý do chuyên môn bắt buộc..."
                  rows={3}
                  value={allergyReasonInput}
                />
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.mutedButton}
                onClick={() => setPendingAllergyDrug(null)}
                type="button"
              >
                Hủy bỏ kê toa này
              </button>
              <button
                className={styles.modalDangerButton}
                disabled={allergyReasonInput.trim().length < MIN_OVERRIDE_REASON_LENGTH}
                onClick={confirmAllergyOverride}
                type="button"
              >
                Bắt buộc ghi đè &amp; thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className={cn(styles.modalOverlay, 'animate-fadeIn backdrop-blur-[2px]')}>
          <div className={cn(styles.modalCard, 'animate-modalIn')}>
            <div className={styles.modalDangerHeader}>
              <p className="text-sm font-extrabold text-[#ba1a1a]">Hủy đơn thuốc đã ký</p>
            </div>
            <div className="px-5 py-4">
              <label className="block">
                <span className={styles.fieldLabel}>Lý do hủy</span>
                <textarea
                  className={styles.textarea}
                  onChange={(event) => setCancelReason(event.target.value)}
                  rows={3}
                  value={cancelReason}
                />
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.mutedButton}
                onClick={() => setIsCancelModalOpen(false)}
                type="button"
              >
                Đóng
              </button>
              <button
                className={styles.modalDangerButton}
                disabled={cancelReason.trim().length === 0 || isBusy}
                onClick={handleCancelSigned}
                type="button"
              >
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
