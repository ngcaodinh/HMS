export const technicianWorkspaceStyles = {
  shell:
    'min-h-screen bg-[#f8fafe] font-sans text-[13px] text-[#171c1f] lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden',
  sidebar:
    'flex min-h-screen flex-col bg-[#001d32] text-white lg:h-screen lg:overflow-hidden',
  sidebarHeader: 'border-b border-white/10 px-4 pb-6 pt-4',
  logoMark:
    'flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#006096] shadow-[0_2px_8px_rgba(0,96,150,0.3)]',
  nav: 'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4',
  navSection: 'px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-white/35',
  navItem:
    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium text-white/65 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50',
  navItemActive:
    'border-l-4 border-[#22d3ee] bg-[#263f51] pl-4 font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  navIcon: 'h-5 w-5 shrink-0',
  sidebarFooter: 'flex items-center gap-3 border-t border-white/10 bg-black/20 px-4 py-4',
  workspace: 'flex min-h-screen min-w-0 flex-col overflow-hidden lg:h-screen',
  topbar:
    'flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#bfc7d2] bg-white px-6',
  content: 'min-h-0 flex-1 overflow-auto',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#c0c7d1] bg-[#f2f3f8] px-6 text-[10px] text-[rgba(65,71,79,0.45)]',
  card:
    'rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  sectionTitle: 'text-[12px] font-bold uppercase tracking-[1.2px] text-[#006096]',
  searchInput:
    'h-10 w-full rounded-lg border border-[#bfc7d2] bg-[#f2f3f8] px-10 text-[13.5px] text-[#171c1f] outline-none placeholder:text-[#707882] focus:border-[#006096] focus:bg-white focus:ring-4 focus:ring-[#006096]/10',
  iconButton:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#bfc7d2] bg-[#f8fafc] text-[#3f4851] transition hover:bg-[#eaeef2] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  primaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007abc] px-4 text-[12px] font-bold text-white shadow-hms-button transition hover:bg-[#006096] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  secondaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#bfc7d2] bg-white px-4 text-[12px] font-bold text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-[#f2f3f8] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
} as const;
