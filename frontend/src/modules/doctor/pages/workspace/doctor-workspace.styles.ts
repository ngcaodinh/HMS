export const doctorWorkspaceStyles = {
  page: 'min-h-screen bg-[#f6fafe] font-sans text-[#171c1f] lg:flex',
  statGrid: 'grid grid-cols-3 border-b border-white/10 bg-white/10',
  statItem: 'border-r border-white/10 bg-white/[0.04] px-1 py-2 text-center last:border-r-0',
  statValue: 'text-xl font-bold leading-5',
  statLabel: 'mt-1 text-[10px] leading-[15px] text-white/50',
  queueScroll: 'flex min-h-0 flex-1 flex-col gap-4 overflow-auto py-4',
  sidebarSearch: 'relative px-4',
  sidebarSearchInput:
    'h-9 w-full rounded-md border border-white/10 bg-white/10 pl-9 pr-3 text-xs text-white/80 outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/15 focus:ring-2 focus:ring-[#55d7ed]/40',
  sidebarSection:
    'px-4 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-white/40',
  queueItem:
    'mx-0 flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#55d7ed]/40',
  queueItemActive:
    'rounded-bl-lg rounded-tl-lg rounded-tr-lg border-l-4 border-[#55d7ed] bg-white/15 pl-4 shadow-sm',
  queueNumber: 'flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold',
  queueName: 'truncate text-[12.5px] font-medium leading-[18.75px] text-white',
  queueMeta: 'block text-[11px] leading-[16.5px] text-white/50',
  queuePill: 'shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold leading-[15px]',
  userAvatar: 'relative h-10 w-10 shrink-0 overflow-hidden bg-white',
  userName: 'truncate text-sm font-bold leading-5 text-white',
  userRole: 'text-[11px] font-medium leading-[16.5px] text-white/50',
  iconButton:
    'ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-95',
  workspace: 'flex min-h-screen min-w-0 flex-1 flex-col bg-[#f6fafe] lg:h-screen',
  topbar:
    'flex min-h-[52px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#c0c7d1] bg-white px-5 py-3 lg:min-h-[64px] lg:px-6',
  topbarTitle: 'text-base font-bold leading-6 text-[#004871]',
  topbarRight: 'flex items-center gap-4 text-right',
  netBadge:
    'inline-flex items-center gap-1.5 rounded-full bg-[#d4f0e0] px-2.5 py-1 text-[11px] font-semibold text-[#1b6e3f]',
  dutyPill:
    'inline-flex items-center gap-1.5 rounded-full border border-[rgba(27,110,63,0.2)] bg-[#d4f0e0] px-2.5 py-1 text-[10px] font-semibold text-[#1b6e3f]',
  topbarTimeStrong: 'whitespace-nowrap text-xs font-medium leading-[18px] text-[#3f4851]',
  topbarTime: 'whitespace-nowrap text-xs leading-[18px] text-[#3f4851]',
  body: 'min-h-0 flex-1 overflow-auto p-4 sm:p-5 lg:p-6',
  bodyEmpty: 'flex items-center justify-center p-8',
  patientCard:
    'mb-4 rounded-[12px] border border-[#c0c7d1] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  patientGrid: 'grid gap-4 lg:grid-cols-[54px_1fr_220px]',
  patientIcon:
    'flex h-[54px] w-[54px] items-center justify-center rounded-[10px] border border-[#96ccff] bg-[#cee5ff]',
  chip: 'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-[15px]',
  metricLabel: 'text-[10px] font-bold uppercase leading-[15px] text-[#707882]',
  metricValue: 'mt-0.5 text-xs font-bold leading-[18px] text-[#171c1f]',
  outlineButton:
    'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#006096] bg-white px-3 text-xs font-bold text-[#006096] transition hover:bg-[#eef8ff] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 active:scale-[0.98]',
  mutedButton:
    'inline-flex h-9 items-center justify-center rounded-md border border-[#c0c7d1] bg-[#f2f3f8] px-3 text-xs font-bold text-[#707882] transition hover:bg-[#e4e9ed] hover:text-[#3f4851] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 active:scale-[0.98]',
  stepTabs:
    'mb-4 flex min-h-12 overflow-x-auto rounded-[12px] border border-[#c0c7d1] bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  stepTab:
    'flex h-12 shrink-0 items-center gap-2 border-b-[3px] border-transparent px-3 text-[13px] font-medium text-[#707882] transition-colors hover:text-[#006096]',
  stepTabActive: 'border-[#006096] font-bold text-[#006096]',
  stepNumber:
    'flex h-5 w-5 items-center justify-center rounded-full bg-[#f2f3f8] text-[11px] font-bold text-[#707882]',
  stepNumberActive: 'bg-[#006096] text-white',
  emptyState: 'mx-auto flex w-full max-w-[576px] flex-col items-center justify-center text-center',
  emptyIconWrap:
    'flex h-48 w-48 items-center justify-center rounded-full border border-[rgba(0,72,113,0.1)] bg-[rgba(0,72,113,0.05)]',
  emptyGuideCard:
    'rounded-[12px] border border-[#c0c7d1] bg-white p-[17px] text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
  emptyGuideNumber:
    'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,122,188,0.1)] text-base font-bold leading-6 text-[#007abc]',
  card: 'rounded-[12px] border border-[#bfc7d2] bg-white p-5 shadow-[0_2px_6px_rgba(0,96,150,0.08)]',
  cardTitle: 'flex items-center gap-3 text-[15px] font-bold leading-[22.5px] text-[#171c1f]',
  cardIcon: 'flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[#cbe7f5]',
  fieldLabel:
    'mb-2 block text-xs font-semibold uppercase leading-[18px] tracking-[0.5px] text-[#3f4851]',
  input:
    'h-12 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] leading-6 text-[#171c1f] outline-none transition-colors focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  textarea:
    'min-h-24 w-full resize-none rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 py-3 text-[13px] leading-6 text-[#171c1f] outline-none transition-colors focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  searchInputLg:
    'h-12 w-full rounded-[12px] border border-[#bfc7d2] bg-[#f0f4f8] pl-11 pr-4 text-[13.5px] text-[#171c1f] outline-none transition-colors placeholder:text-[#6b7280] focus:border-[#006096] focus:bg-white focus:ring-4 focus:ring-[#006096]/10',
  searchResultItem:
    'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-[#f0f4f8] focus:bg-[#f0f4f8] focus:outline-none',
  primaryButton:
    'inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#006096] px-6 text-[13px] font-semibold text-white shadow-[0_3px_6px_rgba(0,96,150,0.22)] transition hover:bg-[#00527f] hover:shadow-[0_4px_10px_rgba(0,96,150,0.3)] focus:outline-none focus:ring-4 focus:ring-[#006096]/20 active:scale-[0.98]',
  tableWrap: 'overflow-hidden rounded-[12px] border border-[#bfc7d2]',
  table: 'min-w-full divide-y divide-[#e5e7eb] text-left text-[13px]',
  th: 'bg-[#f2f3f8] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.55px] text-[#707882]',
  td: 'px-4 py-3.5 text-[#171c1f]',
  tableRow: 'transition-colors hover:bg-[#f8fafc]',
  dangerLink:
    'text-xs font-bold text-[#ba1a1a] underline-offset-2 transition-colors hover:text-[#93000a] hover:underline focus:underline focus:outline-none',
  statusNormal: 'rounded-full bg-[#d4f0e0] px-2 py-1 text-[11px] font-bold text-[#1b6e3f]',
  statusHigh: 'rounded-full bg-[#fee2e2] px-2 py-1 text-[10px] font-bold uppercase text-[#b91c1c]',
  statusPending: 'rounded-full bg-[#ffecd4] px-2 py-1 text-[11px] font-bold text-[#a05c00]',
  alertInfo:
    'rounded-md border border-[#bae6fd] bg-[#f0f9ff] px-3 py-2 text-[13px] font-medium text-[#0369a1]',
  alertSuccess:
    'rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-[13px] font-medium text-[#15803d]',
  alertDanger:
    'rounded-md border border-[#ffdad6] bg-[#fff5f4] px-3 py-2 text-[13px] font-medium text-[#ba1a1a]',
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-[#3a3f47]/70 p-4',
  modalCard: 'w-full max-w-md rounded-[16px] bg-white shadow-xl',
  modalDocumentCard:
    'flex max-h-[92vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[4px] bg-white shadow-2xl',
  modalDocumentHeader:
    'flex shrink-0 items-center justify-between bg-[#171c1f] px-5 py-3 text-white',
  modalInfoHeader: 'rounded-t-[16px] bg-[#f0f9ff] px-5 py-4 text-[#0369a1]',
  modalDangerHeader: 'rounded-t-[16px] bg-[#ffdad6] px-5 py-4 text-[#ba1a1a]',
  modalSuccessHeader: 'rounded-t-[16px] bg-[#d4f0e0] px-5 py-4 text-[#1b6e3f]',
  modalFooter: 'flex flex-wrap justify-end gap-2 border-t border-[#bfc7d2] px-5 py-4',
  modalDangerButton:
    'rounded-md bg-[#ba1a1a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#93000a] focus:outline-none focus:ring-4 focus:ring-[#ba1a1a]/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
  secondaryButton:
    'inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#006096] bg-white px-6 text-[13px] font-semibold text-[#006096] transition hover:bg-[#eef8ff] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 active:scale-[0.98]',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#c0c7d1] bg-[#f2f3f8] px-4 text-[10px] text-[rgba(65,71,79,0.4)]',
} as const;
