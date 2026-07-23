import Image from 'next/image';

type IconProps = {
  className?: string;
};

const stats = [
  {
    label: 'BỆNH NHÂN / THÁNG',
    suffix: 'K+',
    value: '1.2',
  },
  {
    label: 'UPTIME HỆ THỐNG',
    suffix: '%',
    value: '98',
  },
  {
    label: 'HỖ TRỢ TRỰC TUYẾN',
    suffix: '/7',
    value: '24',
  },
];

function UserIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function LockIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M6.5 8V6.5a3.5 3.5 0 0 1 7 0V8m-8 0h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm4.5 3.25v1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M2.5 10s2.75-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.75 4.5-7.5 4.5S2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HeadsetIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M4 11V9a6 6 0 0 1 12 0v2M4 11h2v4H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm10 0h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v-4Zm0 4c0 1.1-.9 2-2 2h-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6fafe] font-sans text-[#171c1f] lg:flex">
      <section className="relative flex min-h-[360px] flex-1 overflow-hidden px-6 py-7 text-white sm:px-10 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12">
        <Image
          alt=""
          className="object-cover object-center"
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          src="/hms-login-background.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(40deg,#001d32_0%,rgba(0,29,50,0.86)_48%,rgba(0,29,50,0.18)_100%)]" />
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-24 w-full text-white/20"
          fill="none"
          viewBox="0 0 900 96"
        >
          <path
            d="M0 66h64l18-34 18 52 26-82 22 64h78l14-23 18 23h86l20-42 18 64 24-86 25 64h86l16-26 18 26h104l24-48 18 48h126"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M20 72h54m92 0h46m330 0h52m96 0h60"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>

        <div className="relative z-10 flex w-full flex-col justify-between gap-12">
          <Image
            alt="Logo Bệnh viện Da liễu Trung ương"
            className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
            height={96}
            priority
            src="/hms-login-logo.png"
            width={96}
          />

          <div className="max-w-[576px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-2 text-[11px] font-bold uppercase text-white/90 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
              HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG
            </div>

            <h1 className="max-w-[520px] text-[38px] font-extrabold leading-[1.1] sm:text-5xl">
              Nền tảng quản lý{' '}
              <span className="text-[#9eefff]">chuyên khoa da liễu</span> thế
              hệ mới
            </h1>
            <p className="mt-6 max-w-[448px] text-base font-medium leading-7 text-white sm:text-lg">
              Hỗ trợ bác sĩ và nhân viên y tế theo dõi bệnh nhân, quản lý hồ sơ
              điều trị và điều phối lịch khám một cách nhanh chóng, chính xác.
            </p>

            <dl className="mt-9 grid max-w-[576px] grid-cols-3 overflow-hidden rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm">
              {stats.map((stat, index) => (
                <div
                  className={`px-3 py-5 text-center sm:px-6 ${
                    index > 0 ? 'border-l border-white/10' : ''
                  }`}
                  key={stat.label}
                >
                  <dt className="text-[10px] font-bold uppercase text-white/90">
                    {stat.label}
                  </dt>
                  <dd className="mb-1 text-2xl font-bold leading-8 text-white">
                    {stat.value}
                    <span className="align-baseline text-base text-[#9eefff]">
                      {stat.suffix}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="relative flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:w-[480px] lg:px-16">
        <div className="absolute bottom-0 left-0 top-0 hidden w-[3px] bg-[linear-gradient(180deg,#0ea5d5_0%,#006096_52%,#003a5d_100%)] lg:block" />

        <div className="w-full max-w-[360px]">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-0.5 w-5 rounded-full bg-[#006096]" />
              <p className="text-[10.5px] font-bold uppercase leading-4 text-[#006096]">
                Cổng nhân viên
              </p>
            </div>
            <h2 className="mt-3 text-3xl font-bold leading-9">
              Đăng nhập hệ thống
            </h2>
            <p className="mt-2 text-sm leading-[22.75px] text-[#3f4851]">
              Nhập thông tin tài khoản để truy cập hồ sơ và quản lý bệnh nhân.
            </p>
          </div>

          <form className="mt-8 space-y-5">
            <div>
              <label
                className="mb-2 block pl-1 text-[11px] font-bold uppercase leading-4 text-[#3f4851]"
                htmlFor="username"
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]" />
                <input
                  autoComplete="username"
                  className="h-12 w-full rounded-xl border border-[#bfc7d2] bg-white px-12 text-sm text-[#171c1f] outline-none transition placeholder:text-[#bfc7d2] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
                  id="username"
                  name="username"
                  placeholder="Mã nhân viên hoặc tên đăng nhập"
                  type="text"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-2 block pl-1 text-[11px] font-bold uppercase leading-4 text-[#3f4851]"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707882]" />
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-[#bfc7d2] bg-white px-12 text-sm text-[#171c1f] outline-none transition placeholder:text-[#bfc7d2] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10"
                  id="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  type="password"
                />
                <button
                  aria-label="Hiện mật khẩu"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[#707882] transition hover:bg-[#f0f5fa] hover:text-[#006096] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
                  type="button"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <label className="flex items-center gap-2 text-[13px] text-[#3f4851]">
                <input
                  className="h-5 w-5 rounded-md border-[#bfc7d2] accent-[#006096]"
                  name="remember"
                  type="checkbox"
                />
                Ghi nhớ đăng nhập
              </label>
              <a
                className="text-[13px] font-semibold text-[#006096] transition hover:text-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
                href="#forgot-password"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004a75] via-[#006096] to-[#007abc] text-base font-bold text-white shadow-hms-button transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#006096]/20"
              type="submit"
            >
              Đăng nhập
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#dfe3e7]" />
            <p className="text-[10px] font-bold uppercase leading-4 text-[#707882]">
              Hỗ trợ & liên hệ
            </p>
            <span className="h-px flex-1 bg-[#dfe3e7]" />
          </div>

          <footer className="mt-7 flex items-center justify-between gap-4 text-[11px]">
            <p className="font-medium text-[#3f4851]/60">
              © 2025 Clinical Excellence
            </p>
            <a
              className="flex items-center gap-1.5 font-bold text-[#006096] transition hover:text-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/10"
              href="#it-support"
            >
              <HeadsetIcon className="h-4 w-4" />
              Hỗ trợ kỹ thuật IT
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
