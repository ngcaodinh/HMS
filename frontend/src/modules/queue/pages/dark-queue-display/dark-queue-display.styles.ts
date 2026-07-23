export const darkQueueDisplayStyles = {
  page:
    'queue-tv-screen grid h-screen w-screen grid-rows-[auto_1fr_auto] overflow-hidden bg-[#07111e] font-sans text-[#e8f4fb]',
  header:
    'flex shrink-0 flex-col gap-5 border-b-[1.5px] border-[#29b6f6]/30 bg-[#0d1e30] px-5 py-4 sm:px-9 lg:flex-row lg:items-center lg:justify-between lg:gap-5',
  brand: 'flex min-w-0 items-center gap-4',
  logo:
    'h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#0288d1] shadow-[0_0_18px_rgba(2,136,209,0.32)]',
  eyebrow: 'text-[11px] font-bold uppercase tracking-[3px] text-[#0288d1]',
  headerTitle: 'text-center text-[17px] font-bold leading-6 tracking-[0.03em] text-[#e8f4fb]',
  headerRight: 'flex items-center justify-between gap-5 lg:justify-end',
  clock: 'text-right text-[28px] font-extrabold leading-none tracking-normal text-[#e8f4fb]',
  status:
    'inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#00c853]/35 bg-[#00c853]/15 px-3.5 py-2 text-xs font-bold text-[#6effa8]',
  main: 'grid min-h-0 overflow-hidden lg:grid-cols-2',
  currentSection:
    'relative flex min-h-[620px] flex-col items-center justify-center overflow-hidden border-r-[1.5px] border-[#29b6f6]/30 bg-[#07111e] px-5 py-8 text-center lg:min-h-0',
  currentGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_55%,rgba(2,136,209,0.11)_0%,transparent_72%)]',
  callingBadge:
    'inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#0288d1] bg-[#0288d1]/10 px-[18px] py-[7px] text-[13px] font-bold uppercase tracking-[2.5px] text-[#0288d1]',
  currentNumber:
    'mt-5 text-[clamp(7.5rem,16vw,11.25rem)] font-black leading-none tracking-normal text-[#29b6f6] sm:tracking-[-0.04em]',
  department:
    'mt-1 text-[15px] font-semibold uppercase tracking-[0.04em] text-[#94b8cc]',
  destination:
    'mt-6 inline-flex min-w-[260px] items-center justify-center gap-4 rounded-[18px] bg-[#0288d1] px-8 py-[18px] text-left shadow-[0_0_36px_rgba(2,136,209,0.32),0_4px_16px_rgba(0,0,0,0.3)]',
  destinationIcon:
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white',
  helpText: 'mt-7 max-w-[340px] text-base font-medium leading-[1.55] text-[#94b8cc]',
  historySection: 'flex min-h-[620px] flex-col overflow-hidden bg-[#0d1e30] lg:min-h-0',
  historyHeader:
    'flex shrink-0 items-center gap-2.5 border-b-[1.5px] border-[#29b6f6]/30 bg-[#0f2236] px-7 py-4',
  historyIcon:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0288d1]/20 text-[#29b6f6]',
  countBadge:
    'ml-auto rounded-full border-[1.5px] border-[#0288d1]/50 bg-[#29b6f6]/20 px-3 py-1 text-xs font-bold tracking-[0.03em] text-[#29b6f6]',
  statsBar: 'grid shrink-0 grid-cols-3 gap-px border-b-[1.5px] border-[#29b6f6]/30 bg-[#29b6f6]/30',
  statItem: 'bg-[#0d1e30] px-4 py-2.5 text-center',
  tableHeader:
    'grid shrink-0 grid-cols-3 border-b-[1.5px] border-[#29b6f6]/10 bg-[#162840] px-7 py-2.5 text-[10.5px] font-bold uppercase tracking-[2px] text-[#4f7a92]',
  historyRows: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  row:
    'grid min-h-0 flex-1 grid-cols-3 items-center border-b px-7',
  footer:
    'flex h-[52px] shrink-0 overflow-hidden border-t-2 border-[#29b6f6]/50 bg-[#0288d1] text-white',
  tickerLabel:
    'z-10 flex shrink-0 items-center gap-2 border-r-[1.5px] border-white/20 bg-black/25 px-6 text-xs font-extrabold uppercase tracking-[2px]',
  tickerTrack: 'queue-ticker-track flex min-w-max items-center',
} as const;
