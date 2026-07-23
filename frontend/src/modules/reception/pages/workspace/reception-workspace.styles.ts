export const receptionWorkspaceStyles = {
  page: 'min-h-screen bg-[#f6fafe] font-sans text-[#171c1f] md:flex',
  sidebar:
    'flex shrink-0 flex-col overflow-hidden border-r border-[#001d32] bg-[#001d32] md:h-screen md:w-[250px]',
  sidebarEmergency: 'border-[#7f1010] bg-[#1a0000]',
  sidebarHeader: 'flex h-[74px] shrink-0 items-center border-b border-white/10 px-4',
  logoWrap:
    'relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#007abc] shadow-[0_2px_4px_rgba(0,96,150,0.3)]',
  brandName: 'text-[15px] font-bold leading-[18.75px] text-white',
  brandSubtitle:
    'mt-0.5 whitespace-nowrap text-[10px] font-normal uppercase leading-[15px] tracking-[0.4px] text-white/55',
  nav: 'flex gap-2 overflow-x-auto bg-[#0d293c] px-2 py-3 md:min-h-0 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto',
  navEmergency: 'bg-[#2b0000]',
  navItem:
    'relative flex min-w-[210px] items-center gap-3 rounded-[10px] px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/50 md:min-w-0',
  navItemActive:
    'rounded-bl-lg rounded-tl-lg rounded-tr-lg border-l-4 border-[#22d3ee] bg-white/15 pl-4 shadow-sm',
  navItemQueueInactive: 'border border-transparent text-[#ffcdd2]',
  navItemEmergency: 'border border-[#e53935] bg-[rgba(229,57,53,0.06)] text-[#c62828]',
  navItemEmergencyActive:
    'border border-[#ef5350] bg-[rgba(229,57,53,0.3)] text-[#c62828] ring-2 ring-[#e53935]',
  navIcon: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
  navIconQueue: 'bg-[#314959] text-[#22d3ee]',
  navIconQueueEmergency: 'bg-[#1a0000] text-[#ffcdd2]',
  navIconEmergency: 'bg-[rgba(229,57,53,0.12)] text-[#e53935]',
  navTitle: 'whitespace-nowrap text-[12.5px] font-bold leading-[15.63px]',
  navSubtitle: 'mt-0.5 whitespace-nowrap text-[10.5px] font-medium leading-normal',
  sidebarUser:
    'mt-auto hidden h-[73px] shrink-0 items-center gap-3 border-t border-[#001728] px-4 md:flex',
  sidebarUserEmergency: 'border-[#301919]',
  userAvatar:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14b8a6] text-sm font-bold text-white',
  userName: 'truncate text-sm font-semibold leading-5 text-white',
  userRole: 'text-[10px] font-normal leading-[15px] text-white/60',
  logoutButton:
    'ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30',
  workspace: 'flex min-h-screen min-w-0 flex-1 flex-col bg-[#f6fafe] md:h-screen',
  topbar:
    'flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[#bfc7d2] bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_8px_rgba(0,96,150,0.06)] sm:px-5',
  topbarTitle: 'whitespace-nowrap text-sm font-bold leading-normal text-[#171c1f]',
  topbarMeta:
    'hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold leading-normal sm:flex',
  topbarClock: 'whitespace-nowrap text-[13px] font-bold leading-normal text-[#171c1f]',
  workspaceBody: 'min-h-0 flex-1 overflow-hidden',
  emptyState:
    'flex h-full min-h-[calc(100vh-48px)] flex-col items-center justify-center gap-4 px-6 py-10 text-center',
  emptyIcon: 'h-12 w-12 text-[#707882]',
  emptyTitle: 'text-lg font-bold leading-normal text-[#707882]',
  emptyDescription: 'max-w-[300px] text-[13px] font-normal leading-5 text-[#707882]/70',
  primaryButton:
    'rounded-lg bg-[#006096] px-5 py-2.5 text-[13.3px] font-bold leading-normal text-white shadow-[0_3px_6px_rgba(0,96,150,0.3)] transition hover:bg-[#00527f] focus:outline-none focus:ring-4 focus:ring-[#006096]/20',
  queueLayout: 'flex h-full min-h-[calc(100vh-48px)] flex-col overflow-hidden lg:flex-row',
  queuePanel:
    'flex shrink-0 flex-col border-b border-[#bfc7d2] bg-white lg:h-full lg:w-[309px] lg:border-b-0 lg:border-r',
  nowServing:
    'border-b border-[#bfc7d2] bg-gradient-to-br from-[#f0f7fd] to-white px-3.5 pb-3 pt-4',
  sectionKicker: 'text-[9.5px] font-bold uppercase leading-normal tracking-[2px] text-[#006096]',
  servingNumber: 'mt-1 text-[64px] font-black leading-none tracking-normal text-[#006096]',
  servingDesk: 'mt-1 text-[11px] font-semibold leading-normal text-[#3f4851]',
  statusPill:
    'mt-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,96,150,0.25)] bg-[#cee5ff] px-3 py-1 text-[11px] font-bold text-[#006096]',
  queueActions: 'border-b border-[#bfc7d2] px-3.5 py-3',
  secondaryButton:
    'rounded-[10px] border border-[#006096] px-4 py-2.5 text-center text-xs font-bold text-[#006096] transition hover:bg-[#eef8ff] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  dangerOutlineButton:
    'rounded-[10px] border border-[#ba1a1a] px-4 py-2.5 text-center text-xs font-bold text-[#ba1a1a] transition hover:bg-[#fff0ef] focus:outline-none focus:ring-4 focus:ring-[#ba1a1a]/10',
  mutedButton:
    'rounded-[10px] border border-[#bfc7d2] bg-[#f0f4f8] px-4 py-2.5 text-center text-xs font-bold text-[#48626e] transition hover:bg-[#e8eef3] focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  queueTabs: 'flex border-b border-[#bfc7d2]',
  queueTab:
    'flex flex-1 items-center justify-center gap-1 border-b-2 border-transparent px-2 py-2.5 text-[11.5px] font-bold text-[#707882]',
  queueTabActive: 'border-[#006096] text-[#006096]',
  queueList: 'max-h-[280px] overflow-auto px-2 py-1.5 lg:max-h-none lg:flex-1',
  queueItem: 'flex items-center gap-2 rounded-md p-2 transition hover:bg-[#f6fafe]',
  queueNumber: 'w-[42px] shrink-0 text-lg font-black leading-normal text-[#171c1f]',
  queueTime: 'min-w-0 flex-1 text-[11px] font-medium leading-normal text-[#707882]',
  callButton:
    'rounded-full border border-[#006096] px-2.5 py-1 text-[11px] font-bold text-[#006096] transition hover:bg-[#e7f4ff] focus:outline-none focus:ring-2 focus:ring-[#006096]/20',
  formArea: 'flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6fafe]',
  formScroll: 'min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5 sm:py-5',
  infoStrip:
    'mb-3 flex items-center justify-between rounded-[10px] border border-[rgba(0,96,150,0.18)] bg-[rgba(0,96,150,0.06)] px-4 py-3',
  formCard:
    'mb-3 rounded-[14px] border border-[#bfc7d2] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_8px_rgba(0,96,150,0.06)]',
  formLegend:
    'mb-3 border-b border-[#bfc7d2] pb-2.5 text-[11px] font-bold uppercase leading-normal tracking-[1.8px] text-[#707882]',
  fieldLabel: 'mb-1 block text-[11.5px] font-semibold leading-normal text-[#3f4851]',
  required: 'text-[#ba1a1a]',
  input:
    'h-9 w-full rounded-[10px] border border-[#bfc7d2] bg-[#f0f4f8] px-3 text-[13px] leading-normal text-[#171c1f] outline-none transition placeholder:text-[#757575] focus:border-[#006096] focus:ring-4 focus:ring-[#006096]/10',
  genderButton:
    'flex h-9 flex-1 items-center justify-center rounded-[10px] border border-[#bfc7d2] bg-[#f0f4f8] text-[13px] font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#006096]/10',
  genderButtonActive: 'border-[#91c5ee] bg-[#cce5ff] text-[#006096]',
  consent:
    'flex items-start gap-2.5 rounded-[10px] border border-[#bfc7d2] bg-[#f0f4f8] p-3 text-xs font-medium leading-[18px] text-[#171c1f]',
  formFooter: 'flex shrink-0 justify-end gap-2.5 border-t border-[#bfc7d2] bg-white px-4 py-4',
  emergencyBody: 'relative flex min-h-[calc(100vh-48px)] flex-1 overflow-auto bg-white px-4 py-8',
  emergencyGlow:
    'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,40,40,0.07),rgba(198,40,40,0)_46%)]',
  emergencyCard: 'relative mx-auto flex w-full max-w-[540px] flex-col items-center',
  emergencyIcon:
    'flex h-16 w-16 items-center justify-center rounded-[32px] border-2 border-[rgba(198,40,40,0.35)] bg-[rgba(198,40,40,0.1)] text-[#c62828]',
  emergencyTitle:
    'mt-4 text-center text-[22px] font-black leading-normal tracking-normal text-[#c62828]',
  emergencyDescription: 'mt-1 text-center text-[13px] font-medium leading-[19.5px] text-[#3f4851]',
  emergencySection: 'mt-5 w-full rounded-[20px] border border-[#bfc7d2] bg-[#f0f4f8] p-5',
  emergencyKicker:
    'mb-3 block text-[10px] font-bold uppercase leading-normal tracking-[2px] text-[#707882]',
  clinicalGenderButton:
    'flex flex-1 flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-[#bfc7d2] bg-white px-6 py-5 transition focus:outline-none focus:ring-4 focus:ring-[#c62828]/10',
  clinicalGenderButtonActive: 'border-[#c62828] bg-[#fff5f5]',
  clinicalIcon: 'flex h-12 w-12 items-center justify-center rounded-xl',
  textarea:
    'min-h-[90px] w-full resize-none rounded-[10px] border border-[#bfc7d2] bg-white px-3.5 py-3 text-[13px] outline-none transition placeholder:text-[#757575] focus:border-[#c62828] focus:ring-4 focus:ring-[#c62828]/10',
  emergencySubmit:
    'mt-0 w-full rounded-[14px] px-4 py-[18px] text-center text-[17px] font-black uppercase tracking-[0.3px] text-white transition focus:outline-none focus:ring-4 focus:ring-[#c62828]/20',
  emergencySubmitDisabled: 'cursor-not-allowed bg-[#ccc]',
  emergencySubmitEnabled:
    'bg-[#c62828] shadow-[0_4px_10px_rgba(198,40,40,0.24)] hover:bg-[#b42121]',
  emergencyNote:
    'mt-3 w-full rounded-[10px] border border-[rgba(198,40,40,0.15)] bg-[rgba(198,40,40,0.05)] px-4 py-3 text-[11.5px] font-medium leading-[18.4px] text-[#3f4851]',
} as const;
