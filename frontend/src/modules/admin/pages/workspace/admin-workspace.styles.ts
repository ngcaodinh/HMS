/** Token class dùng chung cho shell, topbar, nội dung và nút của Admin workspace. */
export const adminWorkspaceStyles = {
  content: 'min-h-0 flex-1 overflow-auto',
  contentInner: 'space-y-6 p-5 lg:p-8',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#bfc7d2] bg-[#f0f4f8] px-6 text-[10px] text-[#707882]/80',
  iconButton:
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dfe3e7] bg-white text-[#3f4851] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f0f4f8] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  primaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#006096] px-4 text-xs font-bold text-white shadow-hms-button transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004f7e] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  secondaryButton:
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#bfc7d2] bg-white px-4 text-xs font-bold text-[#3f4851] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f0f4f8] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  shell:
    'min-h-screen bg-slate-50 font-sans text-slate-900 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden',
  topbar:
    'flex min-h-16 shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8',
  workspace: 'flex min-h-screen min-w-0 flex-col overflow-hidden lg:h-screen',
} as const;
