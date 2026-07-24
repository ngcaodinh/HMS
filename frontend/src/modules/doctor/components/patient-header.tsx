import type { MedicalRecordDetail } from '../types/medical-record.types';
import { AssetIcon, calculateAge, cn, formatDateVN, genderLabel } from './shared';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

export type DoctorScreen = 'empty' | 'vitals' | 'orders' | 'results' | 'diagnosis';
export type StepId = Exclude<DoctorScreen, 'empty'>;

const steps: Array<{ id: StepId; label: string }> = [
  { id: 'vitals', label: 'Sinh hiệu' },
  { id: 'orders', label: 'Chỉ định CLS' },
  { id: 'results', label: 'Kết quả CLS' },
  { id: 'diagnosis', label: 'Chẩn đoán' },
];

export function Topbar({ hasPatient }: { hasPatient: boolean }) {
  const now = new Date();
  return (
    <header className={styles.topbar}>
      <div className="flex min-w-0 items-center gap-3">
        <h1 className={styles.topbarTitle}>Bác sĩ · EMR – HMS-VN</h1>
      </div>
      <div className={styles.topbarRight}>
        <span className={styles.dutyPill}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#1b6e3f]" />
          Đang trực
        </span>
        {hasPatient && (
          <>
            <div className="h-6 w-px bg-[#bfc7d2]" />
            <div>
              <p className={styles.topbarTimeStrong}>{now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              <p className={styles.topbarTime}>{now.toLocaleTimeString('vi-VN')} ICT</p>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export function PatientSummary({ record, worklistLabel }: { record: MedicalRecordDetail; worklistLabel: string }) {
  const age = calculateAge(record.patient.dateOfBirth);
  const metrics = [
    ['Ngày sinh', formatDateVN(record.patient.dateOfBirth)],
    ['Tuổi', `${age} tuổi`],
    ['Giới tính', genderLabel(record.patient.gender)],
    ['Mã BN', record.patient.patientCode],
    ['Lý do khám', record.chiefComplaint ?? 'Chưa ghi nhận'],
  ];

  return (
    <section className={styles.patientCard}>
      <div className={styles.patientGrid}>
        <div className={styles.patientIcon}>
          <AssetIcon className="h-7 w-7" name="icon-outpatient.svg" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold leading-[27px] text-[#171c1f]">{record.patient.fullName}</h2>
            <span className={cn(styles.chip, 'bg-[#cee5ff] text-[#006096]')}>{record.patient.patientCode}</span>
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

        <div className="flex shrink-0 flex-wrap items-start justify-start gap-2 lg:justify-end">
          <span className={cn(styles.chip, 'bg-[#e5f3ff] text-[#006096]')}>{worklistLabel}</span>
        </div>
      </div>
    </section>
  );
}

export function StepTabs({
  currentScreen,
  hasNewResult,
  onChangeScreen,
}: {
  currentScreen: StepId;
  hasNewResult: boolean;
  onChangeScreen: (screen: StepId) => void;
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
    ['1', 'Chọn BN', 'Chọn BN từ danh sách hàng đợi bên trái.'],
    ['2', 'Mở Tab', 'Hệ thống tự động mở Tab Sinh hiệu và thông tin hành chính.'],
    ['3', 'Khám & CĐ', 'Thực hiện khám lâm sàng, chỉ định CLS và chẩn đoán.'],
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
        Chọn bệnh nhân đầu tiên trong danh sách
      </button>
    </section>
  );
}
