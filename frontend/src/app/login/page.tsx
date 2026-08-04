import Image from 'next/image';

import { LoginForm } from '@/modules/auth/components/login-form';

type LoginPageProps = {
  searchParams?: {
    reason?: string;
  };
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

export default function LoginPage({ searchParams }: LoginPageProps) {
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
              <span className="text-[#9eefff]">chuyên khoa da liễu</span> thế hệ mới
            </h1>
            <p className="mt-6 max-w-[448px] text-base font-medium leading-7 text-white sm:text-lg">
              Hỗ trợ bác sĩ và nhân viên y tế theo dõi bệnh nhân, quản lý hồ sơ điều trị và
              điều phối lịch khám một cách nhanh chóng, chính xác.
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

          <LoginForm initialReason={searchParams?.reason} />
        </div>
      </section>
    </main>
  );
}
