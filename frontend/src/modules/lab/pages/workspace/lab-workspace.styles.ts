export const labWorkspaceStyles = {
  page: 'min-h-screen bg-[#f6fafe] font-sans text-[#171c1f] antialiased lg:flex',
  sidebar:
    'flex shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#001d32] lg:h-screen lg:w-[240px]',
  sidebarHeader: 'flex h-[64px] shrink-0 items-center gap-3 border-b border-white/10 px-4',
  logoWrap:
    'relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#006096] shadow-[0_2px_4px_rgba(0,96,150,0.3)]',
  brandName: 'text-[15px] font-bold leading-[18.75px] text-white',
  brandSubtitle:
    'mt-0.5 whitespace-nowrap text-[10px] uppercase leading-[15px] tracking-[0.4px] text-white/55',
  navSection: 'flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-3 py-4',
  navSectionLabel: 'px-2 pb-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-white/40',
  navItem:
    'group flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-medium text-white/40 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
  navItemActive: 'bg-white/15 text-white shadow-sm',
  navBadge: 'ml-auto rounded-full bg-[#c62828] px-1.5 py-0.5 text-[10px] font-bold text-white',
  sidebarUser: 'mt-auto flex h-[73px] shrink-0 items-center gap-3 border-t border-white/10 px-4',
  userAvatar: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006096] text-sm font-bold text-white',
  userName: 'truncate text-sm font-bold leading-5 text-white',
  userRole: 'truncate text-[11px] font-medium leading-[16.5px] text-white/50',
  iconButton:
    'ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-95',
  workspace: 'flex min-h-screen min-w-0 flex-1 flex-col bg-[#f6fafe] lg:h-screen',
  topbar:
    'flex min-h-[64px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#c0c7d1] bg-white px-5 py-3 lg:px-6',
  topbarTitle: 'text-base font-bold leading-6 text-[#004871]',
  netBadge:
    'inline-flex items-center gap-1.5 rounded-full bg-[#d4f0e0] px-2.5 py-1 text-[11px] font-semibold text-[#1b6e3f]',
  topbarRight: 'flex items-center gap-4 text-right',
  topbarUserName: 'text-[13px] font-bold leading-[19.5px] text-[#171c1f]',
  topbarUserRole: 'mt-0.5 text-[11px] leading-[16.5px] text-[#707882]',
  body: 'min-h-0 flex-1 overflow-auto p-4 sm:p-5 lg:p-6',
  sectionHeading: 'mb-4',
  sectionTitle: 'text-base font-bold leading-6 text-[#171c1f]',
  sectionSubtitle: 'mt-0.5 text-xs text-[#707882]',
  searchRow: 'mb-4 flex flex-wrap items-center gap-3',
  searchWrap: 'relative min-w-[240px] flex-1',
  searchInput:
    'h-11 w-full rounded-md border border-[#bfc7d2] bg-white pl-10 pr-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  filterTab:
    'inline-flex h-11 items-center gap-1.5 rounded-md border border-[#c0c7d1] bg-white px-3.5 text-[13px] font-semibold text-[#3f4851] transition hover:bg-[#f2f3f8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#006096]/15',
  filterTabActive: 'border-[#006096] bg-[#006096] text-white hover:bg-[#00527f]',
  filterTabDanger: 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#fff5f4]',
  filterTabDangerActive: 'border-[#ba1a1a] bg-[#ba1a1a] text-white hover:bg-[#a01717]',
  tableWrap: 'mb-5 overflow-hidden rounded-[12px] border border-[#bfc7d2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  table: 'min-w-full divide-y divide-[#e5e7eb] text-left text-[13px]',
  th: 'bg-[#f2f3f8] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.55px] text-[#707882]',
  td: 'px-4 py-3.5 align-top text-[#171c1f]',
  rowActive: 'bg-[#eef8ff] transition-colors',
  rowHover: 'cursor-pointer transition duration-150 hover:bg-[#f6fafe]',
  chip: 'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-[15px]',
  chipDanger: 'bg-[#fee2e2] text-[#b91c1c]',
  chipPending: 'bg-[#ffecd4] text-[#a05c00]',
  chipDone: 'bg-[#d4f0e0] text-[#1b6e3f]',
  chipNeutral: 'bg-[#e5e7eb] text-[#3f4851]',
  card: 'rounded-[12px] border border-[#bfc7d2] bg-white p-5 shadow-[0_2px_6px_rgba(0,96,150,0.08)]',
  cardHeader: 'mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4',
  cardTitle: 'text-[15px] font-bold leading-[22.5px] text-[#171c1f]',
  infoGrid: 'mb-4 grid gap-4 border-b border-[#e5e7eb] pb-4 sm:grid-cols-2 lg:grid-cols-4',
  metricLabel: 'text-[10px] font-bold uppercase leading-[15px] text-[#707882]',
  metricValue: 'mt-0.5 text-[13px] font-semibold leading-[18px] text-[#171c1f]',
  fieldLabel: 'mb-1.5 block text-xs font-semibold text-[#3f4851]',
  fieldHint: 'mt-1 text-[11px] text-[#8a8f96]',
  input:
    'h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  select:
    'h-10 w-full rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-2 text-[13px] text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  textarea:
    'min-h-20 w-full resize-none rounded-md border border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2 text-[13px] leading-6 text-[#171c1f] outline-none transition-colors duration-150 focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  fieldGrid: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  formSectionTitle: 'mb-3 mt-5 text-[13px] font-bold uppercase tracking-[0.4px] text-[#004871] first:mt-0',
  segmented: 'inline-flex overflow-hidden rounded-md border border-[#bfc7d2]',
  segmentedOption:
    'px-2.5 py-1.5 text-[11px] font-bold text-[#707882] transition hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/20 focus-visible:ring-inset',
  segmentedOptionActiveS: 'bg-[#d4f0e0] text-[#1b6e3f]',
  segmentedOptionActiveI: 'bg-[#ffecd4] text-[#a05c00]',
  segmentedOptionActiveR: 'bg-[#fee2e2] text-[#b91c1c]',
  antibiogramTable: 'min-w-full divide-y divide-[#e5e7eb] text-left text-[12px]',
  dropzone:
    'flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#bfc7d2] bg-[#f8fafc] p-4 text-center transition hover:border-[#006096] hover:bg-[#f0f7ff]',
  attachmentChip:
    'flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs text-[#3f4851] transition-colors hover:border-[#006096] hover:bg-[#eef8ff]',
  actionRow: 'mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#e5e7eb] pt-4',
  primaryButton:
    'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#006096] px-5 text-[13px] font-bold text-white shadow-[0_3px_6px_rgba(0,96,150,0.22)] transition hover:bg-[#00527f] focus:outline-none focus:ring-4 focus:ring-[#006096]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  outlineButton:
    'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#006096] bg-white px-4 text-[13px] font-bold text-[#006096] transition hover:bg-[#eef8ff] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  mutedButton:
    'inline-flex h-10 items-center justify-center rounded-md border border-[#c0c7d1] bg-white px-3.5 text-xs font-bold text-[#707882] transition-colors duration-150 hover:bg-[#f2f3f8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  alertInfo: 'mb-4 rounded-md border border-[#bae6fd] bg-[#f0f9ff] px-4 py-3 text-[13px] font-medium text-[#0369a1]',
  alertDanger: 'mb-4 rounded-md border border-[#ffdad6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#ba1a1a]',
  emptyState: 'flex min-h-[320px] flex-col items-center justify-center gap-2 text-center text-sm text-[#707882]',
  footer:
    'flex h-8 shrink-0 items-center justify-end border-t border-[#c0c7d1] bg-[#f2f3f8] px-4 text-[10px] text-[rgba(65,71,79,0.4)]',
  statGrid: 'mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
  statCard: 'flex items-center gap-3 rounded-[12px] border border-[#bfc7d2] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
  statIconWrap: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
  statValue: 'text-xl font-bold leading-6 text-[#171c1f]',
  statLabel: 'text-[11px] text-[#707882]',
  smallIconButton:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#c0c7d1] bg-white text-[#3f4851] transition hover:bg-[#f2f3f8] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/20',
  actionCellRow: 'flex items-center gap-2',
  smallPrimaryButton:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#006096] px-3 text-xs font-bold text-white transition hover:bg-[#00527f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#006096]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  barChartWrap: 'mb-5 flex h-40 items-end gap-1 overflow-x-auto rounded-[12px] border border-[#bfc7d2] bg-white p-4',
  barChartBar: 'flex-1 rounded-t-sm bg-[#3b82c4] transition hover:bg-[#006096]',
  barChartAxisLabel: 'mt-1 text-center text-[9px] text-[#8a8f96]',
  patientChipBar:
    'mb-4 flex flex-wrap items-center gap-2 rounded-[12px] border border-[#bfc7d2] bg-[#eef8ff] p-3',
  patientChip: 'inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#171c1f] shadow-sm',
  patientChipMuted: 'inline-flex items-center rounded-full bg-white/70 px-3 py-1.5 text-xs text-[#3f4851]',
  tabSwitcher: 'mb-4 flex gap-1 overflow-x-auto rounded-[10px] border border-[#bfc7d2] bg-white p-1',
  tabSwitcherItem:
    'shrink-0 rounded-md px-3.5 py-2 text-[13px] font-semibold text-[#707882] transition hover:text-[#171c1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[#707882]',
  tabSwitcherItemActive: 'bg-[#006096] text-white',
  resultEntryGrid: 'grid gap-5 lg:grid-cols-[1fr_320px]',
  stickyPanel: 'lg:sticky lg:top-4 lg:self-start',
  progressBarWrap: 'mb-4 flex items-center gap-3',
  progressBarTrack: 'h-2 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]',
  progressBarFill: 'h-full rounded-full bg-[#006096] transition-all',
  progressBarLabel: 'shrink-0 text-xs font-semibold text-[#3f4851]',
} as const;
