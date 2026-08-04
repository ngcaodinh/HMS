export const itTechnicianWorkspaceStyles = {
  shell:
    'min-h-screen bg-[#f6fafe] font-sans text-[13px] text-[#171c1f] lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden',
  navIcon: 'h-5 w-5 shrink-0',
  workspace: 'flex min-h-screen min-w-0 flex-col overflow-hidden lg:h-screen',
  topbar:
    'flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#dfe3e7] bg-white px-6 shadow-[0_1px_2px_rgba(0,96,150,0.05)]',
  content: 'min-h-0 flex-1 overflow-auto',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#bfc7d2] bg-[#f0f4f8] px-6 text-[10px] text-[#707882]/80',
  card:
    'rounded-lg border border-[#dfe3e7] bg-white shadow-hms-card transition-shadow duration-200 hover:shadow-md',
  sectionTitle:
    'text-xs font-bold uppercase tracking-[0.8px] text-[#3f4851]',
  searchInput:
    'h-10 w-full rounded-lg border border-[#bfc7d2] bg-white px-10 text-sm text-[#171c1f] outline-none transition placeholder:text-[#707882] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  iconButton:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#dfe3e7] bg-white text-[#3f4851] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f0f4f8] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  primaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#006096] px-4 text-xs font-bold text-white shadow-hms-button transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004f7e] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  secondaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#bfc7d2] bg-white px-4 text-xs font-bold text-[#3f4851] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f0f4f8] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
} as const;
