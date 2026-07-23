export const nurseWorkspaceStyles = {
  shell:
    'min-h-screen bg-[#f8fafc] font-sans text-[13px] text-[#171c1f] lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden',
  sidebar: 'flex min-h-screen flex-col bg-[#0f172a] text-white lg:h-screen lg:overflow-hidden',
  sidebarHeader: 'flex items-center gap-3 border-b border-white/10 px-5 py-4',
  logoMark:
    'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#006096] to-[#60a5fa] shadow-[0_2px_8px_rgba(0,96,150,0.3)]',
  nav: 'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4',
  navSection: 'px-3 py-2 text-[10px] font-bold uppercase leading-4 tracking-[0.8px] text-white/40',
  navItem:
    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-normal text-white/70 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50',
  navItemActive:
    'border-l-4 border-[#22d3ee] bg-[#334155] pl-3 font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  badge:
    'ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white',
  sidebarFooter: 'mt-auto flex items-center gap-3 border-t border-white/10 bg-black/20 px-4 py-4',
  iconButton:
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30',
  workspace: 'flex min-h-screen min-w-0 flex-col overflow-hidden lg:h-screen',
  topbar:
    'flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#cbd5e1] bg-white px-4 py-3 lg:px-6',
  shortcut:
    'inline-flex items-center rounded-sm border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-1 text-[10px] font-bold uppercase leading-4 text-[#64748b]',
  content: 'min-h-0 flex-1 overflow-auto p-4 sm:p-5 lg:p-6',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#cbd5e1] bg-[#f1f5f9] px-6 text-[10px] text-[#41474f]/40',
  card: 'rounded-xl border border-[#cbd5e1] bg-white shadow-[0_1px_4px_rgba(0,96,150,0.04),0_2px_12px_rgba(0,96,150,0.08)]',
  cardHeader:
    'flex items-center justify-between gap-3 rounded-t-xl border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-4',
  cardTitle: 'flex items-center gap-2 text-sm font-bold leading-5 text-[#334155]',
  statCard:
    'rounded-xl border border-[#cbd5e1] bg-white p-4 shadow-[0_1px_4px_rgba(0,96,150,0.04),0_2px_12px_rgba(0,96,150,0.08)]',
  statIcon: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
  primaryButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#006096] px-4 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-[#00527f] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  secondaryButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cbd5e1] bg-white px-4 text-xs font-bold text-[#475569] transition hover:bg-[#f8fafc] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  input:
    'h-10 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-[#334155] outline-none placeholder:text-[#94a3b8] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  textarea:
    'min-h-24 w-full resize-none rounded-lg border border-[#cbd5e1] bg-white px-3 py-3 text-sm leading-6 text-[#334155] outline-none placeholder:text-[#94a3b8] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  label: 'mb-1.5 block text-xs font-bold uppercase leading-4 tracking-[0.2px] text-[#64748b]',
  fieldUnit:
    'flex h-10 min-w-12 items-center justify-center rounded-r-lg border border-l-0 border-[#cbd5e1] bg-[#f1f5f9] px-3 text-xs font-medium text-[#64748b]',
  tableWrap: 'overflow-hidden rounded-xl border border-[#e2e8f0]',
  th: 'bg-[#f8fafc] px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.4px] text-[#64748b]',
  td: 'border-t border-[#f1f5f9] px-4 py-4 align-top text-sm text-[#334155]',
} as const;
