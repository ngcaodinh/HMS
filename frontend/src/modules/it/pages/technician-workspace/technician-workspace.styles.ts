export const itTechnicianWorkspaceStyles = {
  shell:
    'min-h-screen bg-slate-50 font-sans text-[13px] text-slate-900 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden',
  sidebar:
    'flex min-h-screen flex-col bg-slate-900 text-white lg:h-screen lg:overflow-hidden',
  sidebarHeader: 'border-b border-white/10 px-5 pb-7 pt-5',
  logoMark:
    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-700',
  nav: 'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4',
  navSection:
    'px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[1px] text-white/40 first:pt-0',
  navItem:
    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50',
  navItemActive:
    'border-l-4 border-cyan-400 bg-white/20 pl-4 font-semibold text-white shadow-sm',
  navIcon: 'h-5 w-5 shrink-0',
  sidebarFooter: 'border-t border-white/10 bg-black/20 p-4',
  workspace: 'flex min-h-screen min-w-0 flex-col overflow-hidden lg:h-screen',
  topbar:
    'flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 shadow-sm',
  content: 'min-h-0 flex-1 overflow-auto',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-slate-300 bg-slate-100 px-6 text-[10px] text-slate-500/70',
  card: 'rounded-lg border border-slate-200 bg-white shadow-sm',
  sectionTitle:
    'text-xs font-bold uppercase tracking-[0.8px] text-slate-700',
  searchInput:
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-700/10',
  iconButton:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-700/10',
  primaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-800 px-4 text-xs font-bold text-white shadow-hms-button transition hover:bg-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-700/20',
  secondaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-sky-700/10',
} as const;
