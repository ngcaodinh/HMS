import Image from 'next/image';

import {
  BriefcaseMedicalIcon,
  ClockRefreshIcon,
  CounterIcon,
  GroupIcon,
  HospitalSquareIcon,
  ShieldCheckIcon,
} from '../../components/QueueDisplayIcons';
import { dermatologyQueueDisplayStyles as styles } from './dermatology-queue-display.styles';

type NavItem = {
  description: string;
  icon: 'counter' | 'patient' | 'emergency';
  isActive?: boolean;
  isEmergency?: boolean;
  label: string;
};

type TicketItem = {
  action: string;
  number: string;
  time: string;
};

type FieldProps = {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
};

const navItems: NavItem[] = [
  {
    description: 'Gọi số · Nhập hồ sơ',
    icon: 'counter',
    isActive: true,
    label: 'Hàng đợi & Tiếp đón',
  },
  {
    description: 'Tra cứu · Cập nhật danh tính',
    icon: 'patient',
    label: 'Bệnh nhân & Chuẩn hóa',
  },
  {
    description: 'Bypass định danh · Khẩn cấp',
    icon: 'emergency',
    isEmergency: true,
    label: 'Tiếp nhận Cấp cứu',
  },
];

const waitingTickets: TicketItem[] = [
  { action: 'Gọi ngay', number: '1025', time: '02:07' },
  { action: 'Gọi ngay', number: '1026', time: '02:09' },
  { action: 'Gọi ngay', number: '1027', time: '02:12' },
  { action: 'Gọi ngay', number: '1028', time: '02:16' },
  { action: 'Gọi ngay', number: '1029', time: '02:20' },
  { action: 'Gọi ngay', number: '1030', time: '02:24' },
  { action: 'Gọi ngay', number: '1031', time: '02:29' },
  { action: 'Gọi ngay', number: '1032', time: '02:35' },
];

function NavIcon({ icon, isActive }: Pick<NavItem, 'icon' | 'isActive'>) {
  const className = 'h-[18px] w-[18px]';

  if (icon === 'patient') {
    return <GroupIcon className={className} />;
  }

  if (icon === 'emergency') {
    return <span className="text-[28px] font-black leading-none text-[#c62828]">+</span>;
  }

  return <CounterIcon className={`${className} ${isActive ? 'text-[#006096]' : 'text-[#48626e]'}`} />;
}

function SectionTitle({ children, icon }: { children: string; icon: 'patient' | 'shield' | 'group' | 'doctor' }) {
  const iconClassName = 'h-3.5 w-3.5 text-[#707882]';

  return (
    <div className={styles.sectionTitle}>
      {icon === 'shield' ? <ShieldCheckIcon className={iconClassName} /> : null}
      {icon === 'group' ? <GroupIcon className={iconClassName} /> : null}
      {icon === 'doctor' ? <HospitalSquareIcon className={iconClassName} /> : null}
      {icon === 'patient' ? <GroupIcon className={iconClassName} /> : null}
      {children}
    </div>
  );
}

function TextField({ id, label, placeholder, required, type = 'text' }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className={styles.label} htmlFor={id}>
        {label} {required ? <span className="text-[#ba1a1a]">*</span> : null}
      </label>
      <input
        aria-required={required}
        className={styles.input}
        id={id}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

export function DermatologyQueueDisplayPage() {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar} aria-label="Thanh điều hướng chính">
        <div className={styles.sidebarHead}>
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoMark}>
              <Image
                alt="Logo HMS-VN"
                className="h-full w-full object-cover"
                height={32}
                priority
                src="/hms-login-logo.png"
                width={32}
              />
            </div>
            <span className="text-base font-extrabold tracking-[-0.03em] text-[#006096]">HMS-VN</span>
          </div>

          <div className={styles.staffCard}>
            <p className="text-[13px] font-bold text-[#171c1f]">Nguyễn Thị Lan</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#3f4851]">Nhân viên lễ tân · Ca sáng</p>
            <div className={styles.counterChip}>
              <BriefcaseMedicalIcon className="h-3 w-3" />
              Quầy Tiếp Nhận 2
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              aria-current={item.isActive ? 'page' : undefined}
              className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ''} ${
                item.isEmergency ? styles.navItemEmergency : ''
              }`}
              key={item.label}
              type="button"
            >
              <span className={`${styles.navIcon} ${item.isActive ? styles.navIconActive : ''}`}>
                <NavIcon icon={item.icon} isActive={item.isActive} />
              </span>
              <span>
                <span
                  className={`block text-[12.5px] font-bold leading-tight ${
                    item.isEmergency ? 'text-[#c62828]' : item.isActive ? 'text-[#006096]' : 'text-[#171c1f]'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`mt-0.5 block text-[10.5px] font-medium ${
                    item.isEmergency ? 'text-[#e57373]' : item.isActive ? 'text-[#006096]/70' : 'text-[#707882]'
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <button className={styles.logout} type="button">
            <span aria-hidden="true">↪</span>
            Đăng xuất
          </button>
          <p className="py-0.5 text-center text-[10px] text-[#bfc7d2]">
            HMS-VN v3.1.0 · Da liễu edition
          </p>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-sm font-bold text-[#171c1f]">Hàng đợi & Tiếp đón</h1>
            <span className={styles.badge}>
              <ClockRefreshIcon className="h-2.5 w-2.5" />
              Ca sáng · 7:00-12:00
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-[13px] font-bold tabular-nums text-[#171c1f]">02:05</span>
            <span className={styles.badge}>
              <span className="queue-blink-dot h-[7px] w-[7px] rounded-full bg-[#22a84b]" />
              Trực tuyến
            </span>
          </div>
        </header>

        <div className={styles.content}>
          <aside className={styles.queuePanel} aria-label="Hàng đợi tiếp nhận">
            <section className={styles.now} aria-label="Số đang phục vụ">
              <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[2px] text-[#006096]">
                Số đang phục vụ
              </p>
              <p className="text-[64px] font-black leading-none tracking-[-0.05em] text-[#006096] tabular-nums">
                1024
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#3f4851]">Quầy Tiếp Nhận 2</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#006096]/25 bg-[#cee5ff] px-2.5 py-1 text-[11px] font-bold text-[#006096]">
                <span className="queue-blink-dot h-1.5 w-1.5 rounded-full bg-[#006096]" />
                Đang gọi
              </p>
            </section>

            <section className="shrink-0 space-y-2 border-b-[1.5px] border-[#bfc7d2] px-3.5 py-3">
              <button className={styles.primaryButton} type="button">
                Gọi số tiếp theo
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className={styles.secondaryButton} type="button">
                  Gọi lại
                </button>
                <button className={styles.dangerButton} type="button">
                  Bỏ qua
                </button>
              </div>
              <button className={styles.ghostButton} type="button">
                <BriefcaseMedicalIcon className="h-3.5 w-3.5" />
                Bốc số tại quầy
              </button>
            </section>

            <div className="flex shrink-0 border-b-[1.5px] border-[#bfc7d2]">
              <button className={`${styles.tab} ${styles.tabActive}`} type="button">
                Đang chờ
                <span className="ml-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#cee5ff] text-[9px] font-extrabold text-[#006096]">
                  8
                </span>
              </button>
              <button className={styles.tab} type="button">
                Bỏ qua
                <span className="ml-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#eaeef2] text-[9px] font-extrabold text-[#707882]">
                  2
                </span>
              </button>
            </div>

            <div className={styles.queueList} role="list">
              {waitingTickets.map((ticket) => (
                <div className={styles.queueRow} key={ticket.number} role="listitem">
                  <span className="w-[42px] shrink-0 text-lg font-black tabular-nums text-[#171c1f]">
                    {ticket.number}
                  </span>
                  <span className="min-w-0 flex-1 text-[11px] font-medium text-[#707882]">
                    Lấy số lúc {ticket.time}
                  </span>
                  <button className="shrink-0 rounded-full border-[1.5px] border-[#006096] px-2.5 py-1 text-[11px] font-bold text-[#006096] hover:bg-[#006096]/10" type="button">
                    {ticket.action}
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <section className={styles.formPanel} aria-label="Biểu mẫu tiếp nhận bệnh nhân">
            <div className={styles.formInner}>
              <div className={styles.statusbar}>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold text-[#3f4851]">Đang làm thủ tục cho</p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg font-black tabular-nums text-[#006096]">1024</span>
                    <span className="text-[13px] font-semibold text-[#3f4851]">· Quầy Tiếp Nhận 2</span>
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#006096]/20 bg-[#cee5ff] px-2.5 py-1 text-[11px] font-bold text-[#006096]">
                  <span className="queue-blink-dot h-[7px] w-[7px] rounded-full bg-[#006096]" />
                  Đang gọi
                </span>
              </div>

              <section className={styles.card}>
                <div className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-[0.02em] text-[#171c1f]">
                  <ClockRefreshIcon className="h-4 w-4 text-[#006096]" />
                  Tìm kiếm & Đối chiếu bệnh nhân cũ
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-[10px] border-[1.5px] border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2.5 focus-within:border-[#006096] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#006096]/10">
                    <CounterIcon className="h-3.5 w-3.5 text-[#707882]" />
                    <input
                      aria-label="Tìm kiếm bệnh nhân"
                      className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#707882]"
                      placeholder="Họ tên · Số điện thoại · CCCD..."
                      type="search"
                    />
                  </div>
                  <button className="rounded-[10px] bg-[#006096] px-4 py-2.5 text-[12.5px] font-bold text-white hover:bg-[#004a75]" type="button">
                    Tìm kiếm
                  </button>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded-md border border-[#7a4f00]/20 bg-[#ffecd2] px-2.5 py-2 text-[11px] font-medium leading-5 text-[#7a4f00]">
                  <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>NĐ 13/2023:</strong> Kết quả chỉ hiển thị thông tin hành chính được che ký tự nhạy cảm.
                    Không hiển thị bệnh lý, xét nghiệm hoặc dị ứng thuốc ở bước này.
                  </span>
                </div>
              </section>

              <section className={styles.card}>
                <SectionTitle icon="patient">Thông tin hành chính</SectionTitle>
                <div className={styles.formGrid2}>
                  <div className="md:col-span-2">
                    <TextField id="patient-name" label="Họ và tên" placeholder="NGUYỄN VĂN A (in hoa có dấu)" required />
                  </div>
                  <TextField id="patient-dob" label="Ngày sinh" required type="date" />
                  <div className="flex flex-col gap-1">
                    <span className={styles.label}>
                      Giới tính <span className="text-[#ba1a1a]">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="rounded-[10px] border-[1.5px] border-[#006096]/35 bg-[#cee5ff] px-3 py-2.5 text-[13px] font-semibold text-[#006096]" type="button">
                        Nam
                      </button>
                      <button className="rounded-[10px] border-[1.5px] border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2.5 text-[13px] font-semibold text-[#3f4851]" type="button">
                        Nữ
                      </button>
                    </div>
                  </div>
                  <TextField id="patient-phone" label="Số điện thoại" placeholder="09x xxxx xxxx" type="tel" />
                  <TextField id="patient-cccd" label="Số CCCD" placeholder="12 chữ số" required />
                </div>
              </section>

              <section className={styles.card}>
                <SectionTitle icon="shield">Bảo hiểm y tế (BHYT)</SectionTitle>
                <div className={styles.formGrid3}>
                  <TextField id="patient-bhyt" label="Mã số thẻ BHYT" placeholder="XX XXXXXXXXX XXXX" />
                  <TextField id="patient-bhyt-exp" label="Ngày hết hạn thẻ" type="date" />
                  <TextField id="patient-kcb-code" label="Mã nơi đăng ký KCB ban đầu" placeholder="Ví dụ: 07006" />
                </div>
              </section>

              <section className={styles.card}>
                <SectionTitle icon="group">Người bảo hộ / Liên hệ khẩn cấp</SectionTitle>
                <div className={styles.formGrid2}>
                  <TextField id="guardian-name" label="Họ tên người thân" placeholder="Họ và tên người liên hệ" />
                  <TextField id="guardian-phone" label="Điện thoại khẩn cấp" placeholder="09x xxxx xxxx" type="tel" />
                </div>
              </section>

              <section className={styles.card}>
                <SectionTitle icon="doctor">Lý do khám & Bác sĩ</SectionTitle>
                <div className={styles.formGrid2}>
                  <div className="flex flex-col gap-1">
                    <label className={styles.label} htmlFor="doctor">
                      Bác sĩ khám <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <select className={styles.input} id="doctor">
                      <option>-- Chọn bác sĩ đang trực --</option>
                      <option>BS. Trần Minh Khoa · Da liễu tổng quát</option>
                      <option>BS. Lê Thị Hoa · Điều trị mụn & sẹo</option>
                      <option>BS. Nguyễn Văn Tuấn · Dị ứng & Chàm</option>
                    </select>
                  </div>
                  <TextField id="visit-reason" label="Lý do khám" placeholder="Ví dụ: Nổi mề đay, ngứa toàn thân" />
                </div>
              </section>

              <section className={styles.card}>
                <label className="flex items-start gap-2.5 rounded-[10px] border-[1.5px] border-[#bfc7d2] bg-[#f0f4f8] p-3">
                  <input className="mt-0.5 h-5 w-5 rounded accent-[#006096]" type="checkbox" />
                  <span className="text-xs font-medium leading-5 text-[#171c1f]">
                    Xác nhận bệnh nhân đã đọc và{' '}
                    <strong className="text-[#006096]">đồng ý với thông báo bảo vệ dữ liệu cá nhân</strong> của HMS-VN
                    (<em>privacyNoticeAccepted = true</em>).
                  </span>
                </label>
              </section>
            </div>

            <div className={styles.submitBar}>
              <button className={styles.cancelButton} type="button">
                Hủy / Làm mới
              </button>
              <button className={styles.submitButton} type="button">
                Hoàn tất tiếp nhận
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
