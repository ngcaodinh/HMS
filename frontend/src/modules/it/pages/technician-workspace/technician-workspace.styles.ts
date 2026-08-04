export const itTechnicianWorkspaceStyles = {
  shell:
    'min-h-screen bg-[#f6fafe] font-sans text-[13px] text-[#171c1f] lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden',
  sidebar:
    'flex min-h-screen flex-col bg-gradient-to-b from-[#2c3134] to-[#23282b] text-white lg:h-screen lg:overflow-hidden',
  sidebarHeader: 'border-b border-white/10 px-5 pb-7 pt-5',
  logoMark:
    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#006096] ring-2 ring-[#96ccff]/25',
  nav: 'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4',
  navSection:
    'px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[1px] text-white/40 first:pt-0',
  navItem:
    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#96ccff]/60',
  navItemActive:
    'border-l-4 border-[#96ccff] bg-white/15 pl-4 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  navIcon: 'h-5 w-5 shrink-0',
  sidebarFooter: 'border-t border-white/10 bg-black/20 p-4',
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
