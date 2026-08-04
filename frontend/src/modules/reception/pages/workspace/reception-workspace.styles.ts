export const receptionWorkspaceStyles = {
  // fixed inset-0: khóa đúng viewport, không cuộn cả trang / không khoảng trống dưới.
  // Chỉ áp dụng shell màn tiếp nhận — form/queue list vẫn cuộn nội bộ.
  page: 'fixed inset-0 z-0 flex overflow-hidden flex-col bg-[#f6fafe] font-sans text-[#171c1f] md:flex-row',
  nav: 'flex gap-2 overflow-x-auto bg-[#0d293c] px-2 py-3 transition-colors duration-300 md:min-h-0 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto',
  navEmergency: 'bg-[#2b0000]',
  navItem:
    'relative flex min-w-[210px] items-center gap-3 rounded-[10px] px-3 py-3 text-left transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#55d7ed]/50 md:min-w-0',
  navItemActive:
    'rounded-bl-lg rounded-tl-lg rounded-tr-lg border-l-4 border-[#55d7ed] bg-white/15 pl-4 shadow-sm',
  navItemQueueInactive: 'border border-transparent text-[#ffcdd2] hover:bg-white/5',
  navItemEmergency:
    'border border-[#e53935] bg-[rgba(229,57,53,0.06)] text-[#c62828] hover:bg-[rgba(229,57,53,0.12)]',
  navItemEmergencyActive:
    'border border-[#ef5350] bg-[rgba(229,57,53,0.3)] text-[#c62828] ring-2 ring-[#e53935]',
  navIcon:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-200',
  navIconQueue: 'bg-[#314959] text-[#55d7ed]',
  navIconQueueEmergency: 'bg-[#1a0000] text-[#ffcdd2]',
  navIconEmergency: 'bg-[rgba(229,57,53,0.12)] text-[#e53935]',
  navTitle: 'whitespace-nowrap text-[12.5px] font-bold leading-[15.63px]',
  navSubtitle: 'mt-0.5 whitespace-nowrap text-[10.5px] font-medium leading-normal',
  userAvatar:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#008091] text-sm font-bold text-white shadow-[0_2px_4px_rgba(0,128,145,0.35)]',
  userName: 'truncate text-sm font-semibold leading-5 text-white',
  userRole: 'text-[10px] font-normal leading-[15px] text-white/60',
  logoutButton:
    'ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/80 transition-all duration-200 ease-out hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30',
  workspace: 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f6fafe]',
  topbar:
    'flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[#bfc7d2] bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_8px_rgba(0,96,150,0.06)] sm:px-5',
  topbarTitle: 'whitespace-nowrap text-sm font-bold leading-normal text-[#171c1f]',
  topbarMeta:
    'hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold leading-normal sm:flex',
  topbarClock: 'whitespace-nowrap text-[13px] font-bold leading-normal text-[#171c1f]',
  workspaceBody: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  emptyState:
    'flex h-full min-h-0 flex-col items-center justify-center gap-4 px-6 py-10 text-center',
  emptyIcon: 'h-12 w-12 text-[#707882]',
  emptyTitle: 'text-lg font-bold leading-normal text-[#707882]',
  emptyDescription: 'max-w-[300px] text-[13px] font-normal leading-5 text-[#707882]/70',
  primaryButton:
    'rounded-lg bg-gradient-to-r from-[#004a75] via-[#006096] to-[#007abc] px-5 py-2.5 text-[13.3px] font-bold leading-normal text-white shadow-hms-button transition-all duration-200 ease-out hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:hover:brightness-100',
  queueLayout: 'flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden lg:flex-row',
  queuePanel:
    'flex max-h-[42vh] shrink-0 flex-col overflow-hidden border-b border-[#bfc7d2] bg-white lg:max-h-none lg:h-full lg:w-[320px] lg:border-b-0 lg:border-r',
  nowServing:
    'shrink-0 border-b border-[#bfc7d2] bg-gradient-to-br from-[#f0f7fd] to-white px-3.5 pb-3 pt-4',
  sectionKicker: 'text-[9.5px] font-bold uppercase leading-normal tracking-[2px] text-[#006096]',
  servingNumber:
    'mt-1 text-[48px] font-black leading-none tracking-normal text-[#006096] sm:text-[56px] lg:text-[64px]',
  servingDesk: 'mt-1 text-[11px] font-semibold leading-normal text-[#3f4851]',
  statusPill:
    'mt-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,96,150,0.25)] bg-[#cee5ff] px-3 py-1 text-[11px] font-bold text-[#006096]',
  queueActions: 'shrink-0 border-b border-[#bfc7d2] px-3.5 py-3',
  secondaryButton:
    'rounded-[10px] border border-[#006096] px-4 py-2.5 text-center text-xs font-bold text-[#006096] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#eef8ff] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50',
  dangerOutlineButton:
    'rounded-[10px] border border-[#ba1a1a] px-4 py-2.5 text-center text-xs font-bold text-[#ba1a1a] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#fff0ef] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#ba1a1a]/10 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50',
  mutedButton:
    'rounded-[10px] border border-[#bfc7d2] bg-[#f0f4f8] px-4 py-2.5 text-center text-xs font-bold text-[#48626e] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#e8eef3] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50',
  queueTabs: 'flex shrink-0 border-b border-[#bfc7d2]',
  queueTab:
    'flex flex-1 items-center justify-center gap-1 border-b-2 border-transparent px-2 py-2.5 text-[11.5px] font-bold text-[#707882] transition-colors duration-200 hover:text-[#3f4851] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006096]/30 focus-visible:ring-inset',
  queueTabActive: 'border-[#006096] text-[#006096] hover:text-[#006096]',
  queueList: 'min-h-0 flex-1 overflow-y-auto px-2 py-1.5',
  queueItem:
    'flex items-center gap-2 rounded-md p-2 transition-colors duration-150 hover:bg-[#f6fafe]',
  queueNumber: 'w-[42px] shrink-0 text-lg font-black leading-normal text-[#171c1f]',
  queueTime: 'min-w-0 flex-1 text-[11px] font-medium leading-normal text-[#707882]',
  callButton:
    'rounded-full border border-[#006096] px-2.5 py-1 text-[11px] font-bold text-[#006096] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#e7f4ff] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#006096]/20',
  formArea: 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f6fafe]',
  formScroll: 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 sm:py-5',
  infoStrip:
    'mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[rgba(0,96,150,0.18)] bg-[rgba(0,96,150,0.06)] px-4 py-3',
  formCard: 'mb-3 rounded-[14px] border border-[#bfc7d2] bg-white p-4 shadow-hms-card',
  formLegend:
    'mb-3 border-b border-[#bfc7d2] pb-2.5 text-[11px] font-bold uppercase leading-normal tracking-[1.8px] text-[#707882]',
  fieldLabel: 'mb-1 block text-[11.5px] font-semibold leading-normal text-[#3f4851]',
  required: 'font-bold text-[#ba1a1a]',
  input:
    'h-9 w-full rounded-[10px] border border-[#bfc7d2] bg-white px-3 text-[13px] leading-normal text-[#171c1f] outline-none transition-all duration-150 placeholder:text-[#757575] focus:border-[#006096] focus:bg-white focus:ring-4 focus:ring-[#006096]/10 disabled:cursor-not-allowed disabled:bg-[#e8eef3] disabled:opacity-70',
  genderButton:
    'flex h-9 flex-1 items-center justify-center rounded-[10px] border border-[#bfc7d2] bg-white text-[13px] font-semibold transition-all duration-200 ease-out hover:border-[#96ccff] hover:bg-[#f6fafe] focus:outline-none focus:ring-4 focus:ring-[#006096]/10 disabled:cursor-not-allowed disabled:opacity-60',
  genderButtonActive:
    'border-[#96ccff] bg-[#cee5ff] text-[#006096] hover:border-[#96ccff] hover:bg-[#cee5ff]',
  consent:
    'flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[#bfc7d2] bg-white p-3 text-xs font-medium leading-[18px] text-[#171c1f] transition-colors duration-200 hover:border-[#96ccff]',
  formFooter:
    'flex shrink-0 flex-wrap justify-end gap-2.5 border-t border-[#bfc7d2] bg-white px-4 py-3',
  emergencyBody:
    'relative flex min-h-0 w-full flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-8',
  emergencyGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,40,40,0.07),rgba(198,40,40,0)_46%)]',
  emergencyCard: 'relative mx-auto flex w-full max-w-[540px] flex-col items-center',
  emergencyIcon:
    'flex h-16 w-16 items-center justify-center rounded-[32px] border-2 border-[rgba(198,40,40,0.35)] bg-[rgba(198,40,40,0.1)] text-[#c62828]',
  emergencyTitle:
    'mt-4 text-center text-[22px] font-black leading-normal tracking-normal text-[#c62828]',
  emergencyDescription: 'mt-1 text-center text-[13px] font-medium leading-[19.5px] text-[#3f4851]',
  emergencySection:
    'mt-5 w-full rounded-[20px] border border-[#bfc7d2] bg-[#f0f4f8] p-5 shadow-hms-card',
  emergencyKicker:
    'mb-3 block text-[10px] font-bold uppercase leading-normal tracking-[2px] text-[#707882]',
  clinicalGenderButton:
    'flex flex-1 flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-[#bfc7d2] bg-white px-6 py-5 transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#e9a3a3] hover:shadow-hms-card focus:outline-none focus:ring-4 focus:ring-[#c62828]/10',
  clinicalGenderButtonActive: 'border-[#c62828] bg-[#fff5f5] hover:border-[#c62828]',
  clinicalIcon: 'flex h-12 w-12 items-center justify-center rounded-xl',
  textarea:
    'min-h-[90px] w-full resize-none rounded-[10px] border border-[#bfc7d2] bg-white px-3.5 py-3 text-[13px] outline-none transition-all duration-150 placeholder:text-[#757575] focus:border-[#c62828] focus:ring-4 focus:ring-[#c62828]/10',
  emergencySubmit:
    'mt-0 w-full rounded-[14px] px-4 py-[18px] text-center text-[17px] font-black uppercase tracking-[0.3px] text-white transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#c62828]/20',
  emergencySubmitDisabled: 'cursor-not-allowed bg-[#ccc]',
  emergencySubmitEnabled:
    'bg-[#c62828] shadow-[0_10px_15px_-3px_rgba(198,40,40,0.25),0_4px_6px_-4px_rgba(198,40,40,0.2)] hover:-translate-y-0.5 hover:bg-[#b42121] hover:shadow-[0_14px_22px_-4px_rgba(198,40,40,0.35),0_6px_10px_-6px_rgba(198,40,40,0.25)] active:translate-y-0 active:scale-[0.99]',
  emergencyNote:
    'mt-3 w-full rounded-[10px] border border-[rgba(198,40,40,0.15)] bg-[rgba(198,40,40,0.05)] px-4 py-3 text-[11.5px] font-medium leading-[18.4px] text-[#3f4851]',

  // Style thông báo & banner alert trên giao diện Lễ tân
  alertError:
    'mb-3 flex items-start gap-3 rounded-xl border border-rose-200 border-l-4 border-l-[#c62828] bg-rose-50/90 p-3.5 text-xs font-medium text-[#991b1b] shadow-sm transition-all duration-200 animate-in fade-in',
  alertWarning:
    'mt-3 flex items-start gap-3 rounded-xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/90 p-3.5 text-xs font-medium text-[#844d00] shadow-sm transition-all duration-200 animate-in fade-in',
  alertInfo:
    'mb-3 flex items-start gap-3 rounded-xl border border-[#96ccff] border-l-4 border-l-[#006096] bg-[#f0f7fd] p-3.5 text-xs font-medium text-[#004a75] shadow-sm transition-all duration-200 animate-in fade-in',
  actionErrorBadge:
    'mt-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-semibold text-[#c62828]',
  actionSuccessBadge:
    'mt-2 flex items-center gap-2 rounded-lg border border-[#96ccff] bg-[#f0f7fd] px-3 py-2 text-[11.5px] font-semibold text-[#006096]',
} as const;
