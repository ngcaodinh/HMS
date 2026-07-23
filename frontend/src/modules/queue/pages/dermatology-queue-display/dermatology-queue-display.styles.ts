export const dermatologyQueueDisplayStyles = {
  page:
    'h-screen overflow-hidden bg-[#f6fafe] font-sans text-[13px] text-[#171c1f] lg:grid lg:grid-cols-[250px_1fr]',
  sidebar:
    'hidden min-h-0 flex-col overflow-hidden border-r-[1.5px] border-[#bfc7d2] bg-white lg:flex',
  sidebarHead: 'shrink-0 border-b-[1.5px] border-[#bfc7d2] px-3.5 pb-3.5 pt-4',
  sidebarLogo: 'mb-3 flex items-center gap-2.5',
  sidebarLogoMark:
    'h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#006096] shadow-[0_2px_8px_rgba(0,96,150,0.25)]',
  staffCard: 'rounded-[10px] border-[1.5px] border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2.5',
  counterChip:
    'mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#006096]/20 bg-[#006096]/10 px-2 py-1 text-[10.5px] font-bold text-[#006096]',
  nav: 'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3',
  navItem:
    'flex w-full items-center gap-2 rounded-[10px] border-[1.5px] border-transparent px-2.5 py-2.5 text-left transition hover:bg-[#f0f4f8]',
  navItemActive: 'border-[#006096]/20 bg-[#006096]/10',
  navItemEmergency:
    'queue-emergency-ring relative overflow-hidden border-[#e53935] bg-[#e53935]/10 hover:bg-[#e53935]/15',
  navIcon:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eaeef2] text-[#48626e]',
  navIconActive: 'bg-[#cee5ff] text-[#006096]',
  sidebarFoot:
    'flex shrink-0 flex-col gap-1 border-t-[1.5px] border-[#bfc7d2] px-2.5 py-3',
  logout:
    'flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-xs font-semibold text-[#707882] transition hover:bg-[#f0f4f8] hover:text-[#ba1a1a]',
  workspace: 'flex min-h-0 flex-col overflow-hidden bg-[#f6fafe]',
  topbar:
    'flex h-12 shrink-0 items-center justify-between gap-3 border-b-[1.5px] border-[#bfc7d2] bg-white px-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_8px_rgba(0,96,150,0.06)]',
  badge:
    'inline-flex items-center gap-1.5 rounded-full border border-[#006096]/20 bg-[#006096]/10 px-2.5 py-1 text-[11px] font-bold text-[#006096]',
  content: 'flex min-h-0 flex-1 overflow-hidden',
  queuePanel:
    'hidden min-h-0 w-[30%] min-w-[260px] max-w-[320px] shrink-0 flex-col overflow-hidden border-r-[1.5px] border-[#bfc7d2] bg-white md:flex',
  now:
    'shrink-0 border-b-[1.5px] border-[#bfc7d2] bg-[linear-gradient(160deg,#f0f7fd_0%,#ffffff_100%)] px-3.5 py-4',
  primaryButton:
    'flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#006096] p-[13px] text-[13.5px] font-bold uppercase text-white shadow-[0_3px_10px_rgba(0,96,150,0.28)] transition hover:-translate-y-px hover:bg-[#004a75]',
  secondaryButton:
    'flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#006096] px-2 py-2.5 text-xs font-semibold text-[#006096] transition hover:bg-[#006096]/10',
  dangerButton:
    'flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#ba1a1a] px-2 py-2.5 text-xs font-semibold text-[#ba1a1a] transition hover:bg-[#ba1a1a]/10',
  ghostButton:
    'flex w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#bfc7d2] bg-[#f0f4f8] p-2.5 text-xs font-semibold text-[#48626e] transition hover:bg-[#eaeef2]',
  tab:
    'flex-1 border-b-[2.5px] border-transparent bg-transparent px-1 py-2.5 text-center text-[11.5px] font-bold text-[#707882]',
  tabActive: 'border-[#006096] text-[#006096]',
  queueList: 'min-h-0 flex-1 overflow-y-auto px-2 py-1.5',
  queueRow:
    'mb-1 flex items-center gap-2 rounded-md px-2 py-2 transition hover:bg-[#f0f4f8]',
  formPanel: 'min-w-0 flex-1 overflow-y-auto bg-[#f6fafe]',
  formInner: 'px-4 py-5 sm:px-5',
  statusbar:
    'mb-[18px] flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-[#006096]/20 bg-[#006096]/10 px-3.5 py-2.5',
  card:
    'mb-4 rounded-[14px] border-[1.5px] border-[#bfc7d2] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_8px_rgba(0,96,150,0.06)]',
  sectionTitle:
    'mb-3 flex items-center gap-2 border-b border-[#bfc7d2] pb-2.5 text-[11px] font-bold uppercase tracking-[1.8px] text-[#707882]',
  input:
    'w-full rounded-[10px] border-[1.5px] border-[#bfc7d2] bg-[#f0f4f8] px-3 py-2.5 text-[13px] text-[#171c1f] outline-none transition placeholder:text-[#707882] focus:border-[#006096] focus:bg-white focus:ring-4 focus:ring-[#006096]/10',
  label: 'text-[11.5px] font-semibold text-[#3f4851]',
  formGrid: 'grid gap-3',
  formGrid2: 'grid gap-3 md:grid-cols-2',
  formGrid3: 'grid gap-3 lg:grid-cols-3',
  submitBar:
    'sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-2.5 border-t-[1.5px] border-[#bfc7d2] bg-white p-4',
  submitButton:
    'flex items-center gap-2 rounded-[10px] bg-[#006096] px-7 py-[13px] text-sm font-extrabold uppercase tracking-[0.02em] text-white shadow-[0_3px_12px_rgba(0,96,150,0.3)] transition hover:-translate-y-px hover:bg-[#004a75]',
  cancelButton:
    'rounded-[10px] border-[1.5px] border-[#bfc7d2] px-5 py-[13px] text-[13px] font-semibold text-[#3f4851] transition hover:bg-[#f0f4f8]',
} as const;
