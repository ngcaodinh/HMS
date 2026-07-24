export const kioskRootStyles = {
  page:
    'relative flex min-h-screen overflow-hidden bg-[#f6fafe] font-sans text-[#171c1f] print:hidden',
  background:
    'pointer-events-none absolute inset-0 overflow-hidden',
  backgroundCircleLarge:
    'absolute -left-[90px] top-[36%] h-[450px] w-[450px] rounded-full bg-[#006096]/[0.045]',
  backgroundCircleTop:
    'absolute right-[10%] top-[13%] h-[260px] w-[260px] rounded-full bg-[#006096]/[0.04]',
  backgroundCircleBottom:
    'absolute bottom-[-120px] right-[-64px] h-[320px] w-[320px] rounded-full bg-[#006673]/[0.035]',
  shell:
    'relative z-10 flex min-h-screen w-full flex-col',
  header:
    'flex min-h-[78px] shrink-0 items-center justify-between gap-4 border-b-2 border-[#bfc7d2] bg-white px-4 py-4 shadow-sm sm:px-8',
  brand:
    'flex min-w-0 items-center gap-4',
  logoWrap:
    'relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]',
  logo:
    'h-full w-full rounded-2xl object-contain p-1',
  brandName:
    'text-2xl font-bold leading-[30px] tracking-normal text-[#006096]',
  brandSubtitle:
    'hidden text-xs font-medium leading-4 tracking-normal text-[#3f4851] sm:block',
  headerRight:
    'flex shrink-0 items-center gap-5',
  clock:
    'hidden min-w-[160px] text-right sm:block',
  clockTime:
    'block text-[32px] font-bold leading-8 tracking-normal text-[#171c1f]',
  clockDate:
    'mt-1 block text-[13px] font-medium leading-5 text-[#3f4851]',
  network:
    'flex items-center gap-2 rounded-full border-2 border-transparent px-[18px] py-2.5 text-[13px] font-semibold leading-5',
  networkOnline:
    'bg-[#e6f5ec] text-[#1a6e38]',
  networkOffline:
    'border-[#f5a8a8] bg-[#ffdad6] text-[#ba1a1a]',
  networkDot:
    'h-[9px] w-[9px] rounded-full',
  networkDotOnline:
    'bg-[#22a84b]',
  networkDotOffline:
    'bg-[#ba1a1a]',
  main:
    'relative flex flex-1 flex-col items-center justify-center gap-9 px-5 py-8',
  hero:
    'flex flex-col items-center gap-5 text-center',
  heroIcon:
    'h-40 w-40',
  heading:
    'text-[30px] font-bold leading-[37.5px] tracking-normal text-[#171c1f]',
  headingAccent:
    'block text-[#006096]',
  subheading:
    'mt-2.5 text-lg font-normal leading-7 tracking-normal text-[#3f4851]',
  ctaWrap:
    'relative flex flex-col items-center',
  ctaButton:
    'relative flex min-h-[140px] w-[320px] items-center justify-center rounded-3xl bg-[#006096] px-6 py-6 text-white shadow-[0_6px_14px_rgba(0,96,150,0.35)] transition hover:bg-[#00527f] focus:outline-none focus:ring-4 focus:ring-[#006096]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#9fb8c9]',
  ctaRingInner:
    'pointer-events-none absolute inset-[-10px] rounded-[34px] border-[3px] border-[#006096]/30',
  ctaRingOuter:
    'pointer-events-none absolute inset-[-22px] rounded-[46px] border-2 border-[#006096]/15',
  ctaContent:
    'flex flex-col items-center justify-center gap-2',
  ctaIcon:
    'h-11 w-11',
  ctaText:
    'text-center text-[26px] font-bold leading-[39px] tracking-normal',
  offlineMessage:
    'mt-8 hidden max-w-[440px] items-start gap-3 rounded-2xl border border-[#f5a8a8] bg-[#ffdad6] px-5 py-4 text-left text-[15px] font-medium leading-6 text-[#7a0d0d]',
  offlineMessageVisible:
    'flex',
  footer:
    'shrink-0 border-t-2 border-[#bfc7d2] bg-[#f2f3f8] px-5 pb-4 pt-[18px] text-center sm:px-8',
  footerGuide:
    'flex flex-wrap items-center justify-center gap-1.5 text-base font-medium leading-6 text-[#3f4851]',
  footerStrong:
    'font-bold',
  footerCopy:
    'mt-1 text-xs font-normal leading-4 tracking-normal text-[#707882]',
  overlay:
    'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-[1px]',
  modal:
    'relative flex w-full max-w-[500px] flex-col items-center rounded-[28px] bg-white p-8 text-center shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] sm:p-10',
  modalIconWrap:
    'mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#e0f2fe] bg-[#f0f9ff]',
  modalIcon:
    'h-10 w-10 text-[#0ea5e9]',
  modalLabel:
    'mb-2 text-base font-bold uppercase leading-6 tracking-[0.1em] text-[#64748b]',
  modalNumber:
    'mb-4 text-[84px] font-bold leading-none tracking-normal text-[#006096] sm:text-[100px]',
  modalType:
    'mb-8 text-xl font-medium leading-7 text-[#475569]',
  timestamp:
    'mb-8 flex w-full items-center justify-center gap-3 rounded-xl border border-[#e0f2fe]/50 bg-[#f0f9ff]/50 px-6 py-4 text-lg font-semibold leading-7 text-[#334155]',
  modalActions:
    'flex w-full flex-col gap-4',
  secondaryButton:
    'flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#e2e8f0] bg-[#f8fafc] px-4 py-[18px] text-lg font-bold leading-7 text-[#334155] transition hover:bg-[#eef6fb] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  primaryButton:
    'flex w-full items-center justify-center gap-3 rounded-2xl bg-[#006096] px-4 py-5 text-lg font-bold leading-7 text-white shadow-hms-button transition hover:bg-[#00527f] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  printTicket:
    'hidden bg-white p-[6mm_5mm] text-black print:block',
  printTicketInner:
    'mx-auto w-[80mm] font-sans text-black',
} as const;
