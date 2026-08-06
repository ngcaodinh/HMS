'use client';

import { useEffect, useRef, useState } from 'react';

import type { MedicalRecordDetail } from '../types/medical-record.types';
import { renderMedicalRecordTemplate } from './medical-record-template';
import { AssetIcon, calculateAge, cn, formatDateVN, genderLabel } from './SharedComponents';
import { doctorWorkspaceStyles as styles } from '../pages/workspace/doctor-workspace.styles';

/** Các màn hình trong workflow khám; `empty` là trạng thái chưa chọn hồ sơ. */
export type DoctorScreen = 'empty' | 'vitals' | 'orders' | 'results' | 'diagnosis' | 'prescription';

/** Định danh các bước có thể hiển thị sau khi đã chọn bệnh nhân. */
export type StepId = Exclude<DoctorScreen, 'empty'>;

const BASE_STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'vitals', label: 'Sinh hiệu' },
  { id: 'orders', label: 'Chỉ định CLS' },
  { id: 'results', label: 'Kết quả CLS' },
  { id: 'diagnosis', label: 'Chẩn đoán' },
];

const PRESCRIPTION_STEP: { id: StepId; label: string } = { id: 'prescription', label: 'Đơn thuốc' };

/**
 * Tính danh sách bước hiển thị theo loại điều trị đã chẩn đoán.
 * @param diagnosis Chẩn đoán hiện tại; đơn thuốc chỉ xuất hiện khi treatmentType là `outpatient`.
 * @returns Các bước khám cơ bản, kèm bước kê đơn cho điều trị ngoại trú.
 * @remarks Đây chỉ là quyết định hiển thị của UI; quyền chẩn đoán/kê đơn vẫn do backend kiểm soát.
 */
export function visibleSteps(
  diagnosis: { treatmentType: string | null } | null,
): Array<{ id: StepId; label: string }> {
  if (diagnosis?.treatmentType === 'outpatient') return [...BASE_STEPS, PRESCRIPTION_STEP];
  return BASE_STEPS;
}

/**
 * Hiển thị thanh tiêu đề workspace bác sĩ và đồng hồ theo giờ địa phương của trình duyệt.
 * @returns UI trạng thái trực tuyến/trực ca và ngày giờ hiện tại; component không tự tải dữ liệu.
 * @remarks Trạng thái hiển thị không phải bằng chứng authorization; access được kiểm tra ở page/API.
 */
export function Topbar() {
  const [now, setNow] = useState<Date | null>(null);

  // Đồng bộ đồng hồ với external timer khi mount; dọn interval khi unmount để tránh cập nhật state
  // trên component đã rời workspace.
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
            {now
              ? now.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : ' '}
          </p>
          <p className={styles.topbarTime}>
            {now ? `${now.toLocaleTimeString('vi-VN')} ICT` : ' '}
          </p>
        </div>
      </div>
    </header>
  );
}

/**
 * Hiển thị danh tính và tóm tắt hồ sơ bệnh nhân đang được bác sĩ khám.
 * @param onCloseRecord Callback bỏ hồ sơ đang chọn khỏi workspace; không đóng hồ sơ nghiệp vụ.
 * @param record Aggregate hồ sơ từ API, gồm patient identity, trạng thái cấp cứu và dữ liệu khám.
 * @param worklistLabel Nhãn trạng thái đã được page ánh xạ từ worklist.
 * @returns UI patient header và modal xem mẫu bệnh án khi người dùng yêu cầu.
 * @remarks Component không tự fetch, không có loading/error/empty state riêng; dữ liệu nhạy cảm chỉ
 *   hiển thị trong boundary đã được page bảo vệ và UI không thay thế authorization backend.
 */
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
        <div
          className={cn(
            'flex h-[54px] w-[54px] items-center justify-center rounded-[10px] border',
            avatarTone,
          )}
        >
          <AssetIcon className="h-7 w-7" name="icon-outpatient.svg" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold leading-[27px] text-[#171c1f]">
              {record.patient.fullName}
            </h2>
            <span className={cn(styles.chip, 'bg-[#cee5ff] text-[#006096]')}>
              {record.patient.patientCode}
            </span>
            {record.isEmergency && (
              <span className={cn(styles.chip, 'bg-[#ba1a1a] text-white')}>CẤP CỨU</span>
            )}
            {record.patient.allergies && (
              <span className={cn(styles.chip, 'bg-[#ffdad6] text-[#ba1a1a]')}>
                Dị ứng: {record.patient.allergies}
              </span>
            )}
            {record.patient.healthInsuranceCode && (
              <span className={cn(styles.chip, 'bg-[#edf3ff] text-[#174ea6]')}>
                BHYT: {record.patient.healthInsuranceCode}
              </span>
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
            <button
              className={styles.outlineButton}
              onClick={() => setIsRecordModalOpen(true)}
              type="button"
            >
              Xem bệnh án
            </button>
            <button className={styles.mutedButton} onClick={onCloseRecord} type="button">
              Đóng hồ sơ
            </button>
          </div>
        </div>
      </div>

      {isRecordModalOpen && (
        <MedicalRecordModal
          onClose={() => setIsRecordModalOpen(false)}
          record={record}
        />
      )}
    </section>
  );
}

/**
 * Hiển thị mẫu bệnh án chuẩn và gửi nội dung iframe vào lệnh in của trình duyệt.
 * @param onClose Callback đóng modal và quay lại patient header.
 * @param record Dữ liệu hồ sơ dùng để render template, không chứa payload mẫu thật trong comment.
 * @returns Modal với trạng thái tải, lỗi tải mẫu hoặc bản xem trước sẵn sàng để in.
 * @remarks GET template chạy ở client; request có AbortController, còn iframe chỉ được in khi đã
 *   load. UI modal không mở rộng quyền đọc hồ sơ.
 */
function MedicalRecordModal({
  onClose,
  record,
}: {
  onClose: () => void;
  record: MedicalRecordDetail;
}) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState(false);
  const [isTemplateReady, setIsTemplateReady] = useState(false);
  const renderedTemplate = template
    ? renderMedicalRecordTemplate(template, record)
    : null;

  // Template phụ thuộc lần mở modal; AbortController hủy request khi đóng modal hoặc unmount.
  useEffect(() => {
    const controller = new AbortController();

    async function loadTemplate() {
      try {
        const response = await fetch('/api/doctor/medical-record-template', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Không thể tải mẫu bệnh án.');
        setTemplate(await response.text());
      } catch (error) {
        if (!controller.signal.aborted) setTemplateError(true);
      }
    }

    void loadTemplate();
    return () => controller.abort();
  }, []);

  // Chỉ xử lý click in khi iframe đã có contentWindow; focus trước print để dùng đúng tài liệu xem trước.
  function handlePrint() {
    const printFrame = printFrameRef.current?.contentWindow;
    if (!printFrame) return;
    printFrame.focus();
    printFrame.print();
  }

  return (
    <div
      className={cn(
        styles.modalOverlay,
        'animate-fadeIn backdrop-blur-[2px] sm:p-8 print:static print:animate-none print:bg-transparent print:p-0 print:backdrop-blur-none',
      )}
    >
      <div
        className={cn(
          styles.modalDocumentCard,
          'animate-modalIn print:max-h-none print:animate-none print:overflow-visible print:rounded-none print:shadow-none',
        )}
      >
        <div className={cn(styles.modalDocumentHeader, 'print:hidden')}>
          <p className="text-sm font-bold text-white">
            Phân hệ Bác sĩ — Hồ sơ bệnh án (Mẫu 08/BV-01)
          </p>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <AssetIcon className="h-4 w-4 invert" name="icon-close.svg" />
          </button>
        </div>

        <div className="overflow-y-auto bg-[#e4e9ed] px-4 py-6 sm:px-8">
          {renderedTemplate ? (
            <iframe
              className="mx-auto h-[calc(92vh-155px)] min-h-[720px] w-full max-w-[210mm] border-0 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.15)]"
              onLoad={() => setIsTemplateReady(true)}
              ref={printFrameRef}
              srcDoc={renderedTemplate}
              title="Bản xem trước bệnh án"
            />
          ) : (
            <p className="py-16 text-center text-sm text-[#707882]">
              {templateError ? 'Không thể tải mẫu bệnh án. Vui lòng thử lại.' : 'Đang tải mẫu bệnh án...'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-[#bfc7d2] bg-white px-6 py-4 print:hidden">
          <button
            className="inline-flex h-10 min-w-[115px] items-center justify-center rounded-md border border-[#c0c7d1] bg-[#f2f3f8] px-5 text-[13px] font-semibold text-[#707882] transition hover:bg-[#e4e9ed] hover:text-[#3f4851] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            Quay lại
          </button>
          <button
            className="inline-flex h-10 min-w-[115px] items-center justify-center gap-2 rounded-md bg-[#006096] px-5 text-[13px] font-semibold text-white shadow-[0_3px_6px_rgba(0,96,150,0.22)] transition hover:bg-[#00527f] hover:shadow-[0_4px_10px_rgba(0,96,150,0.3)] focus:outline-none focus:ring-4 focus:ring-[#006096]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!renderedTemplate || !isTemplateReady}
            onClick={handlePrint}
            type="button"
          >
            In Bệnh án
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hiển thị các bước workflow và đánh dấu khi hồ sơ có kết quả mới.
 * @param currentScreen Bước đang được chọn.
 * @param hasNewResult Cờ từ record để hiển thị thông báo ở bước kết quả.
 * @param onChangeScreen Callback chuyển bước; page/workspace quyết định bước có hợp lệ hay không.
 * @param steps Danh sách bước đã được lọc theo loại điều trị.
 * @returns Thanh điều hướng các bước; không tự fetch hoặc mutation.
 * @remarks Đây là navigation UI, không phải permission gate cho API lâm sàng.
 */
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
            <span className={cn(styles.stepNumber, active && styles.stepNumberActive)}>
              {index + 1}
            </span>
            {step.label}
            {step.id === 'results' && hasNewResult && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
            )}
            {index < steps.length - 1 && <span className="ml-1 text-[#bfc7d2]">›</span>}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Hiển thị trạng thái rỗng trước khi bác sĩ chọn hoặc gọi bệnh nhân tiếp theo.
 * @param onStart Callback gọi bệnh nhân đầu tiên trong worklist do page cung cấp.
 * @returns Hướng dẫn workflow và nút bắt đầu; không tự tải worklist hay mutation.
 * @remarks Khi worklist rỗng, callback không làm thay đổi dữ liệu; quyền gọi bệnh nhân vẫn do page/API
 *   quyết định. Component này không có loading/error/forbidden state riêng.
 */
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
      <h2 className="mt-5 text-base font-bold leading-6 text-[#171c1f]">
        Sẵn sàng tiếp nhận bệnh nhân
      </h2>
      <p className="mt-4 max-w-[448px] text-center text-base leading-[26px] text-[#41474f]">
        Vui lòng chọn một bệnh nhân từ danh sách hàng đợi bên trái để bắt đầu quá trình khám lâm
        sàng.
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
      <button
        className={cn(styles.primaryButton, 'mt-6 px-6 text-base font-bold')}
        onClick={onStart}
        type="button"
      >
        <AssetIcon className="h-4 w-[22px] brightness-0 invert" name="icon-call-next.svg" />
        Gọi bệnh nhân kế tiếp
      </button>
    </section>
  );
}
