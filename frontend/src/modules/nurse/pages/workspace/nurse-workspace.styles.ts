/**
 * Tập class Tailwind dùng chung cho shell và các control của nurse workspace.
 * Các giá trị chỉ là presentation token; không chứa state, dữ liệu y tế hay quyền truy cập.
 */
export const nurseWorkspaceStyles = {
  shell:
    'min-h-screen bg-[#f6fafe] font-sans text-[13px] text-[#171c1f] lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:overflow-hidden',
  logoMark:
    'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#006096] to-[#60a5fa] shadow-[0_2px_8px_rgba(0,96,150,0.3)]',
  badge:
    'ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white',
  sidebarFooter: 'mt-auto flex items-center gap-3 border-t border-white/10 bg-black/20 px-4 py-4',
  iconButton:
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30',
  workspace: 'flex min-h-screen min-w-0 flex-col overflow-hidden lg:h-screen',
  topbar:
    'flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#bfc7d2] bg-white px-4 py-3 lg:px-6',
  shortcut:
    'inline-flex items-center rounded-sm border border-[#e4e9ed] bg-[#eaeef2] px-2 py-1 text-[10px] font-bold uppercase leading-4 text-[#3f4851]',
  content: 'min-h-0 flex-1 overflow-auto p-4 sm:p-5 lg:p-6',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#bfc7d2] bg-[#eaeef2] px-6 text-[10px] text-[#3f4851]/40',
  card: 'rounded-xl border border-[#bfc7d2] bg-white shadow-[0_1px_4px_rgba(0,96,150,0.04),0_2px_12px_rgba(0,96,150,0.08)]',
  cardHeader:
    'flex items-center justify-between gap-3 rounded-t-xl border-b border-[#bfc7d2] bg-[#f0f4f8] px-4 py-4',
  cardTitle: 'flex items-center gap-2 text-sm font-bold leading-5 text-[#171c1f]',
  statCard:
    'rounded-xl border border-[#bfc7d2] bg-white p-4 shadow-[0_1px_4px_rgba(0,96,150,0.04),0_2px_12px_rgba(0,96,150,0.08)]',
  statIcon: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
  primaryButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#006096] px-4 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-[#004a75] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  secondaryButton:
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#bfc7d2] bg-white px-4 text-xs font-bold text-[#3f4851] transition hover:bg-[#f0f4f8] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  input:
    'h-10 w-full rounded-lg border border-[#bfc7d2] bg-white px-3 text-sm text-[#171c1f] outline-none placeholder:text-[#707882] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  textarea:
    'min-h-24 w-full resize-none rounded-lg border border-[#bfc7d2] bg-white px-3 py-3 text-sm leading-6 text-[#171c1f] outline-none placeholder:text-[#707882] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  label: 'mb-1.5 block text-xs font-bold uppercase leading-4 tracking-[0.2px] text-[#3f4851]',
  fieldUnit:
    'flex h-10 min-w-12 items-center justify-center rounded-r-lg border border-l-0 border-[#bfc7d2] bg-[#eaeef2] px-3 text-xs font-medium text-[#3f4851]',
  tableWrap: 'overflow-hidden rounded-xl border border-[#e4e9ed]',
  th: 'bg-[#f0f4f8] px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.4px] text-[#3f4851]',
  td: 'border-t border-[#eaeef2] px-4 py-4 align-top text-sm text-[#171c1f]',
} as const;
