'use client';

import { useEffect, useState, type ReactNode } from 'react';

import type { MedicalRecordDetail } from '../types/medical-record.types';
import { AssetIcon, calculateAge, cn, formatDateVN, genderLabel } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

export type DoctorScreen = 'empty' | 'vitals' | 'orders' | 'results' | 'diagnosis' | 'prescription';
export type StepId = Exclude<DoctorScreen, 'empty'>;

const BASE_STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'vitals', label: 'Sinh hiệu' },
  { id: 'orders', label: 'Chỉ định CLS' },
  { id: 'results', label: 'Kết quả CLS' },
  { id: 'diagnosis', label: 'Chẩn đoán' },
];

const PRESCRIPTION_STEP: { id: StepId; label: string } = { id: 'prescription', label: 'Đơn thuốc' };

/** Tab 5A only appears once the record is diagnosed with an outpatient plan — updateTab5Visibility() in doctor.html. */
export function visibleSteps(diagnosis: { treatmentType: string } | null): Array<{ id: StepId; label: string }> {
  if (diagnosis?.treatmentType === 'outpatient') return [...BASE_STEPS, PRESCRIPTION_STEP];
  return BASE_STEPS;
}

export function Topbar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-3">
        <h1 className={styles.topbarTitle}>
          <strong>Bác sĩ</strong> · EMR – HMS-VN
        </h1>
        <span className={styles.netBadge} role="status">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1b6e3f]" />
          Online
        </span>
      </div>
      <div className={styles.topbarRight}>
        <span className={styles.dutyPill}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1b6e3f]" />
          Đang trực
        </span>
        <div className="h-6 w-px bg-[#bfc7d2]" />
        <div>
          <p className={styles.topbarTimeStrong}>
            {now ? now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : ' '}
          </p>
          <p className={styles.topbarTime}>{now ? `${now.toLocaleTimeString('vi-VN')} ICT` : ' '}</p>
        </div>
      </div>
    </header>
  );
}

export function PatientSummary({
  onCloseRecord,
  record,
  worklistLabel,
}: {
  onCloseRecord: () => void;
  record: MedicalRecordDetail;
  worklistLabel: string;
}) {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const age = calculateAge(record.patient.dateOfBirth);
  const metrics = [
    ['Ngày sinh', formatDateVN(record.patient.dateOfBirth)],
    ['Tuổi', `${age} tuổi`],
    ['Giới tính', genderLabel(record.patient.gender)],
    ['Mã BN', record.patient.patientCode],
    ['Lý do khám', record.chiefComplaint ?? 'Chưa ghi nhận'],
  ];

  const avatarTone = record.isEmergency
    ? 'border-[#ba1a1a]/30 bg-[#ffdad6] text-[#ba1a1a]'
    : record.patient.gender === 'female'
      ? 'border-[#008091]/25 bg-[#e0f7fa] text-[#006673]'
      : 'border-[#96ccff] bg-[#cee5ff] text-[#006096]';

  return (
    <section className={styles.patientCard}>
      <div className={styles.patientGrid}>
        <div className={cn('flex h-[54px] w-[54px] items-center justify-center rounded-[10px] border', avatarTone)}>
          <AssetIcon className="h-7 w-7" name="icon-outpatient.svg" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold leading-[27px] text-[#171c1f]">{record.patient.fullName}</h2>
            <span className={cn(styles.chip, 'bg-[#cee5ff] text-[#006096]')}>{record.patient.patientCode}</span>
            {record.isEmergency && <span className={cn(styles.chip, 'bg-[#ba1a1a] text-white')}>CẤP CỨU</span>}
            {record.patient.allergies && (
              <span className={cn(styles.chip, 'bg-[#ffdad6] text-[#ba1a1a]')}>Dị ứng: {record.patient.allergies}</span>
            )}
            {record.patient.healthInsuranceCode && (
              <span className={cn(styles.chip, 'bg-[#edf3ff] text-[#174ea6]')}>BHYT: {record.patient.healthInsuranceCode}</span>
            )}
          </div>
          <dl className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-3 xl:grid-cols-5">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <dt className={styles.metricLabel}>{label}</dt>
                <dd className={styles.metricValue}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
          <span className={cn(styles.chip, 'bg-[#e5f3ff] text-[#006096]')}>{worklistLabel}</span>
          <div className="flex w-full justify-end gap-2">
            <button className={styles.outlineButton} onClick={() => setIsRecordModalOpen(true)} type="button">
              Xem bệnh án
            </button>
            <button className={styles.mutedButton} onClick={onCloseRecord} type="button">
              Đóng hồ sơ
            </button>
          </div>
        </div>
      </div>

      {isRecordModalOpen && <MedicalRecordModal onClose={() => setIsRecordModalOpen(false)} record={record} />}
    </section>
  );
}

/** Mẫu 08/BV-01 rút gọn — bố cục theo đúng ảnh tham chiếu Tailieu/PIC_CHAN_DOAN_LAM_SANG,
 * đổ dữ liệu thật thay vì iframe tĩnh benhan.html (file gốc không có hook data-ba để bind). */
function MedicalRecordModal({ onClose, record }: { onClose: () => void; record: MedicalRecordDetail }) {
  const vitals = record.latestVitalSigns;
  const ca = record.clinicalAssessment;
  const admittedAt = new Date(record.createdAt);
  const chiefComplaintLower = record.chiefComplaint ? record.chiefComplaint.toLowerCase() : 'lý do chưa ghi nhận';
  const summaryParts: string[] = [
    `Bệnh nhân ${genderLabel(record.patient.gender).toLowerCase()}, ${calculateAge(record.patient.dateOfBirth)} tuổi, vào viện vì ${chiefComplaintLower}.`,
  ];
  if (record.patient.allergies) summaryParts.push(`Tiền sử dị ứng: ${record.patient.allergies}.`);
  summaryParts.push(
    record.diagnosis
      ? `Chẩn đoán: ${record.diagnosis.icd10} — ${record.diagnosis.diagnosisText}`
      : 'Chưa có chẩn đoán xác định.',
  );
  const summary = summaryParts.join(' ');

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-[#3a3f47]/70 p-4 backdrop-blur-[2px] print:static print:animate-none print:bg-transparent print:p-0 print:backdrop-blur-none sm:p-8">
      <div className="flex max-h-[92vh] w-full max-w-[900px] animate-modalIn flex-col overflow-hidden rounded-[4px] bg-white shadow-2xl print:max-h-none print:animate-none print:overflow-visible print:rounded-none print:shadow-none">
        <div className="flex shrink-0 items-center justify-between bg-[#171c1f] px-5 py-3 print:hidden">
          <p className="text-sm font-bold text-white">Phân hệ Bác sĩ — Hồ sơ bệnh án (Mẫu 08/BV-01)</p>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white" onClick={onClose} type="button">
            <AssetIcon className="h-4 w-4 invert" name="icon-close.svg" />
          </button>
        </div>

        <div className="overflow-y-auto bg-[#e4e9ed] px-4 py-6 print:bg-white print:p-0 sm:px-8">
          <div
            className="mx-auto max-w-[210mm] bg-white px-10 py-9 text-[13px] leading-[1.55] text-[#171c1f] shadow-[0_1px_8px_rgba(0,0,0,0.15)] print:shadow-none"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="space-y-0.5 text-[12.5px]">
                <p>
                  Sở Y tế: <BaBlank value="TP. Hồ Chí Minh" width="w-32" />
                </p>
                <p>
                  Bệnh viện: <BaBlank value="Da liễu" width="w-28" />
                </p>
                <p>
                  Khoa: <BaBlank value="Da liễu" width="w-20" /> Giường: <BaBlank value={record.status === 'closed' ? '—' : 'NT'} width="w-10" />
                </p>
              </div>
              <div className="pt-2 text-center">
                <h1 className="text-[19px] font-bold uppercase tracking-[1.5px] text-[#1a56b0]">Bệnh án Da liễu</h1>
              </div>
              <div className="text-right text-[12.5px] leading-[1.7]">
                <p>
                  MS: <strong>08/BV-01</strong>
                </p>
                <p>
                  Số lưu trữ: <BaBlank value={record.recordId.slice(0, 8).toUpperCase()} width="w-24" />
                </p>
                <p>
                  Mã YT: <BaBlank value={record.patient.patientCode} width="w-24" />
                </p>
              </div>
            </div>

            <hr className="my-2 border-t border-[#171c1f]" />

            <BaSection title="I. Hành chính">
            <BaRow label="1. Họ và tên (Chữ in hoa)" value={record.patient.fullName.toUpperCase()} />
            <div className="flex flex-wrap gap-x-6">
              <BaRow label="2. Ngày sinh" value={formatDateVN(record.patient.dateOfBirth)} />
              <BaRow label="3. Tuổi" value={String(calculateAge(record.patient.dateOfBirth))} />
              <BaRow label="4. Giới tính" value={genderLabel(record.patient.gender)} />
            </div>
            <BaRow label="7. Địa chỉ" value={record.patient.address ?? 'Chưa ghi nhận'} />
            <BaRow
              label="10. Đối tượng"
              value={record.patient.healthInsuranceCode ? `BHYT — hạn dùng ${formatDateVN(record.patient.healthInsuranceExpiryDate ?? '')}` : 'Thu phí'}
            />
            {record.patient.healthInsuranceCode && <BaRow label="11. Số thẻ BHYT" value={record.patient.healthInsuranceCode} />}
            <BaRow
              label="12. Người nhà khi cần báo tin"
              value={
                record.patient.emergencyContact
                  ? `${record.patient.emergencyContact}${record.patient.emergencyPhoneNumber ? ' · SĐT: ' + record.patient.emergencyPhoneNumber : ''}`
                  : 'Chưa ghi nhận'
              }
            />
            <BaRow
              label="13. Vào viện lúc"
              value={`${admittedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${formatDateVN(record.createdAt)}`}
            />
          </BaSection>

          <BaSection title="II. Quản lý người bệnh">
            <BaRow label="16. Chẩn đoán khi vào khoa điều trị" value={record.diagnosis ? `${record.diagnosis.icd10} — ${record.diagnosis.diagnosisText}` : 'Chưa có chẩn đoán'} />
          </BaSection>

          <BaSection title="III. Bệnh lý">
            <BaRow label="1. Lý do vào viện" value={record.chiefComplaint ?? 'Chưa ghi nhận'} />
            <BaParagraph label="2. Quá trình bệnh lý" value={ca.historyOfPresentIllness} />
            <BaRow label="3. Tiền sử bệnh — Bản thân" value={ca.pastMedicalHistory ?? record.patient.allergies ?? 'Chưa ghi nhận'} />
            <BaRow label="Tiền sử bệnh — Gia đình" value={ca.familyHistory ?? 'Chưa ghi nhận'} />
          </BaSection>

          <BaSection title="IV. Khám bệnh">
            <p className="mb-1 font-bold">1. Toàn thân:</p>
            {vitals ? (
              <div className="mb-2 grid grid-cols-2 gap-x-6 gap-y-1 pl-4 sm:grid-cols-3">
                <BaRow label="Mạch" value={`${vitals.pulse} lần/phút`} />
                <BaRow label="Nhiệt độ" value={vitals.temperatureC ? `${vitals.temperatureC} °C` : '—'} />
                <BaRow label="Huyết áp" value={`${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`} />
                <BaRow label="Nhịp thở" value={vitals.respiratoryRate ? `${vitals.respiratoryRate} lần/phút` : '—'} />
                <BaRow label="Cân nặng" value={vitals.weightKg ? `${vitals.weightKg} kg` : '—'} />
              </div>
            ) : (
              <p className="mb-2 pl-4 text-[#707882]">Chưa ghi nhận sinh hiệu.</p>
            )}
            <BaParagraph label="2. Thương tổn da" value={ca.skinLesionDescription} />
            <BaParagraph label="3. Các bộ phận khác" value="Tim đều, phổi trong, bụng mềm, không sờ chạm gan lách." />
          </BaSection>

            <BaSection title="V. Tổng kết bệnh án">
              <p className="leading-[1.6]">{summary}</p>
            </BaSection>

            <div className="mt-10 flex justify-between text-center text-[12.5px]">
              <div>
                <p className="italic">Người lập bệnh án</p>
                <p className="text-[11px] italic">(Ký và ghi rõ họ tên)</p>
                <p className="mt-10 w-40 border-t border-dotted border-[#555]">&nbsp;</p>
              </div>
              <div>
                <p className="italic">
                  Ngày {admittedAt.getDate()} tháng {admittedAt.getMonth() + 1} năm {admittedAt.getFullYear()}
                </p>
                <p className="font-bold">Trưởng khoa</p>
                <p className="text-[11px] italic">(Ký và ghi rõ họ tên)</p>
              </div>
            </div>
            <p className="mt-8 border-t border-[#171c1f]/20 pt-2 text-center text-[10px] text-[#707882]">
              Hệ thống quản lý bệnh viện điện tử HMS-VN · Bản in thử nghiệm
            </p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[#bfc7d2] bg-white px-6 py-4 print:hidden">
          <button className={styles.mutedButton} onClick={onClose} type="button">
            Quay lại
          </button>
          <button className={styles.primaryButton} onClick={() => window.print()} type="button">
            In Bệnh án
          </button>
        </div>
      </div>
    </div>
  );
}

function BaBlank({ value, width }: { value: string; width: string }) {
  return <span className={cn('inline-block border-b border-dotted border-[#555] px-1 text-[12.5px]', width)}>{value}</span>;
}

function BaSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="mb-3.5">
      <p className="mb-1 text-[13px] font-bold uppercase">{title}</p>
      <div className="space-y-1 pl-1">{children}</div>
    </div>
  );
}

function BaRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="italic">{label}: </span>
      <span className="border-b border-dotted border-[#555]">{value}</span>
    </p>
  );
}

function BaParagraph({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="mb-1">
      <p>
        <span className="font-bold">{label}:</span> {value || <span className="text-[#8a8f96]">Chưa ghi nhận.</span>}
      </p>
    </div>
  );
}

export function StepTabs({
  currentScreen,
  hasNewResult,
  onChangeScreen,
  steps,
}: {
  currentScreen: StepId;
  hasNewResult: boolean;
  onChangeScreen: (screen: StepId) => void;
  steps: Array<{ id: StepId; label: string }>;
}) {
  return (
    <nav aria-label="Quy trình khám" className={styles.stepTabs}>
      {steps.map((step, index) => {
        const active = currentScreen === step.id;

        return (
          <button
            aria-current={active ? 'step' : undefined}
            className={cn(styles.stepTab, active && styles.stepTabActive)}
            key={step.id}
            onClick={() => onChangeScreen(step.id)}
            type="button"
          >
            <span className={cn(styles.stepNumber, active && styles.stepNumberActive)}>{index + 1}</span>
            {step.label}
            {step.id === 'results' && hasNewResult && <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />}
            {index < steps.length - 1 && <span className="ml-1 text-[#bfc7d2]">›</span>}
          </button>
        );
      })}
    </nav>
  );
}

export function EmptyState({ onStart }: { onStart: () => void }) {
  const cards = [
    ['1', 'Chọn BN', 'Chọn bệnh nhân ở nhóm Chờ khám, hoặc có chấm nhấp nháy ở nhóm Có kết quả.'],
    ['2', 'Mở hồ sơ', 'Hệ thống tải hồ sơ và mở Tab 1 — Khám lâm sàng & Sinh hiệu.'],
    ['3', 'Khám & CĐ', 'Ghi sinh hiệu, chỉ định cận lâm sàng, chẩn đoán và kê đơn thuốc.'],
  ];

  return (
    <section className={styles.emptyState}>
      <div className={styles.emptyIconWrap}>
        <AssetIcon className="h-[94px] w-[94px]" name="icon-empty-medical.svg" />
      </div>
      <h2 className="mt-5 text-base font-bold leading-6 text-[#171c1f]">Sẵn sàng tiếp nhận bệnh nhân</h2>
      <p className="mt-4 max-w-[448px] text-center text-base leading-[26px] text-[#41474f]">
        Vui lòng chọn một bệnh nhân từ danh sách hàng đợi bên trái để bắt đầu quá trình khám lâm sàng.
      </p>
      <div className="mt-5 flex w-full max-w-[400px] flex-col gap-4">
        {cards.map(([number, title, description]) => (
          <article className={styles.emptyGuideCard} key={number}>
            <span className={styles.emptyGuideNumber}>{number}</span>
            <h3 className="mt-2 text-base font-bold leading-6 text-[#171c1f]">{title}</h3>
            <p className="mt-1 text-base leading-6 text-[#41474f]">{description}</p>
          </article>
        ))}
      </div>
      <button className={cn(styles.primaryButton, 'mt-6 px-6 text-base font-bold')} onClick={onStart} type="button">
        <AssetIcon className="h-4 w-[22px] brightness-0 invert" name="icon-call-next.svg" />
        Gọi bệnh nhân kế tiếp
      </button>
    </section>
  );
}
