/** Tập hợp utility class dùng chung cho workspace Dược sĩ và Nhà thuốc. */

export const pharmacyWorkspaceStyles = {
  // Khung ứng dụng và bố cục tổng thể.
  shell: 'flex h-screen w-full overflow-hidden bg-[#f6fafe] text-[#171c1f] font-sans text-sm antialiased',

  // Sidebar nền xanh đậm (#001d32), đồng bộ với giao diện HMS.
  // "sidebar" và "sidebarHeader" vẫn được dùng bởi components/sidebar.tsx (lane cũ, không import ở đâu
  // nhưng vẫn nằm trong chương trình biên dịch) - không xoá để tránh vỡ typecheck của file đó.
  sidebar: 'relative z-10 flex h-screen w-[280px] min-w-[280px] flex-col overflow-hidden border-r border-white/10 bg-[#001d32] text-white/95',
  sidebarHeader: 'border-b border-white/10 p-4 pb-3',

  sidebarClockRow: 'mb-1 flex w-full items-center justify-between border-b border-dashed border-white/10 pb-1.5',
  sidebarClockLabel: 'text-[11px] font-medium text-white/45',
  sidebarClockValue: 'text-[13px] font-semibold text-white/85 tabular-nums',
  sidebarUserRow: 'flex items-center justify-between gap-2',
  sidebarUserAvatar: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#55d7ed] to-[#96ccff] text-[12px] font-bold text-[#003d5c]',
  sidebarUserInfo: 'min-w-0 flex-1',
  sidebarUserName: 'truncate text-[12px] font-semibold text-white',
  sidebarUserRole: 'truncate text-[10px] text-white/65',
  sidebarLogoutBtn: 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-none text-white/65 transition-colors hover:border-red-400/40 hover:bg-red-900/30 hover:text-red-300',

  // Vùng workspace chính.
  mainWrap: 'flex h-screen min-w-0 flex-1 flex-col overflow-hidden',
  topHeader: 'z-5 flex h-[58px] min-h-[58px] items-center justify-between border-b border-[#bfc7d2] bg-white px-6',
  topHeaderTitle: 'text-[15px] font-bold leading-tight text-[#171c1f]',
  topHeaderSub: 'text-[11px] font-normal text-[#3f4851]',
  hospitalBadge: 'flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#cee5ff] px-3.5 text-xs font-semibold text-[#006096]',
  headerBtn: 'relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-none bg-[#f0f4f8] text-[#3f4851] transition-all duration-200 ease-out hover:bg-[#eaeef2] hover:text-[#006096] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006096] focus-visible:ring-offset-2',
  notifDot: 'absolute right-[9px] top-[9px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#ba1a1a]',

  contentArea: 'flex-1 overflow-y-auto bg-[#f6fafe] p-6',

  // Tiêu đề màn hình và nút thao tác.
  screenHeader: 'mb-6 flex flex-wrap items-start justify-between gap-2',
  screenTitle: 'text-[22px] font-bold leading-tight text-[#171c1f]',
  screenSubtitle: 'mt-0.5 text-[13px] text-[#3f4851]',
  screenActions: 'flex flex-wrap items-center gap-2',

  btn: 'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-5 text-[13.5px] font-semibold transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2',
  btnSm: 'min-h-[40px] px-3.5 text-[12.5px]',
  btnLg: 'min-h-[52px] px-7 text-[15px]',
  btnPrimary: 'border-none bg-[#006096] text-white shadow-[0_2px_8px_rgba(0,96,150,0.24)] hover:bg-[#004a75] hover:shadow-[0_4px_14px_rgba(0,96,150,0.3)]',
  btnSecondary: 'border-[1.5px] border-[#006096] bg-transparent text-[#006096] hover:bg-[#cee5ff]',
  btnGhost: 'border border-[#bfc7d2] bg-[#f0f4f8] text-[#3f4851] hover:border-[#a8b4bf] hover:bg-[#eaeef2]',
  btnError: 'border-none bg-[#ba1a1a] text-white shadow-[0_2px_8px_rgba(186,26,26,0.24)] hover:bg-[#93000a] hover:shadow-[0_4px_14px_rgba(186,26,26,0.3)]',
  btnErrorOutline: 'border-[1.5px] border-[#ba1a1a] bg-transparent text-[#ba1a1a] hover:bg-[#ffdad6]',
  btnSuccess: 'border-none bg-[#1a7a4a] text-white shadow-[0_2px_8px_rgba(26,122,74,0.24)] hover:bg-[#145c38] hover:shadow-[0_4px_14px_rgba(26,122,74,0.3)]',

  // Thẻ nội dung.
  card: 'overflow-hidden rounded-2xl border border-[#bfc7d2] bg-white shadow-[0_2px_12px_rgba(0,96,150,0.08)] transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,96,150,0.12)]',
  cardHeader: 'flex items-center justify-between gap-2 border-b border-[#e4e9ed] px-6 py-4',
  cardTitle: 'flex items-center gap-1.5 text-[14px] font-bold text-[#171c1f]',
  cardBody: 'p-6',

  // Huy hiệu và nhãn trạng thái.
  badge: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap leading-none',
  badgeDot: 'h-1.5 w-1.5 rounded-full shrink-0',
  badgePending: 'bg-[#fff8e1] text-[#a05c00]',
  badgePaid: 'bg-[#d4f4e2] text-[#1a7a4a]',
  badgeCancelled: 'bg-[#e4e9ed] text-[#707882]',
  badgeWriteoff: 'bg-[#ffdad6] text-[#ba1a1a]',
  badgeNgoaitru: 'bg-[#e3f2fd] text-[#1565c0]',
  badgeNoitru: 'bg-[#ede7f6] text-[#4527a0]',
  badgeBlue: 'bg-[#cee5ff] text-[#006096]',
  signStampBadge: 'inline-flex items-center gap-1 rounded border-[1.5px] border-[#ba1a1a] bg-[#fff0f0] px-2 py-0.5 text-[11px] font-bold tracking-[0.5px] text-[#ba1a1a]',

  // Chip lọc.
  chipBar: 'flex flex-wrap gap-1.5',
  chip: 'inline-flex min-h-[40px] items-center gap-1.5 rounded-full border-[1.5px] border-[#bfc7d2] bg-transparent px-4 text-[12.5px] font-medium text-[#3f4851] transition-all duration-200 ease-out hover:border-[#006096] hover:text-[#006096] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-1',
  chipActive: 'border-[#006096] bg-[#006096] text-white shadow-[0_2px_8px_rgba(0,96,150,0.24)] hover:text-white',

  // Control và ô nhập liệu.
  searchInputWrap: 'relative flex-1 min-w-[200px]',
  searchInput: 'min-h-[48px] w-full rounded-lg border-[1.5px] border-[#bfc7d2] bg-white pl-10 pr-3.5 text-[13.5px] text-[#171c1f] outline-none transition-all duration-150 focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
  selectField: 'min-h-[48px] rounded-lg border-[1.5px] border-[#bfc7d2] bg-white px-3.5 text-[13.5px] text-[#171c1f] outline-none transition-all duration-150 focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15 cursor-pointer',
  formControl: 'min-h-[48px] w-full rounded-lg border-[1.5px] border-[#bfc7d2] bg-white px-3.5 text-[13.5px] text-[#171c1f] outline-none transition-all duration-150 focus:border-[#006096] focus:ring-2 focus:ring-[#006096]/15',
  formGroup: 'mb-4',
  formLabel: 'mb-1.5 block text-[12px] font-semibold text-[#3f4851]',

  // Bảng dữ liệu.
  dataTableWrap: 'w-full overflow-x-auto',
  dataTable: 'w-full border-collapse text-left text-[13px]',
  th: 'border-b border-[#e4e9ed] bg-[#f0f4f8] px-3 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.3px] text-[#3f4851]',
  td: 'border-b border-[#f0f4f8] px-3 py-2.5 align-middle',
  tr: 'transition-colors duration-150 hover:bg-[#f0f4f8]',

  // Cảnh báo và KPI.
  alert: 'mb-4 flex items-start gap-2.5 rounded-lg p-4 text-[13px] leading-relaxed',
  alertInfo: 'border border-[#bfdbfe] bg-[#dbeafe] text-[#004e8c]',
  alertError: 'border border-[#f5c6c6] bg-[#ffdad6] text-[#ba1a1a]',
  alertWarning: 'border border-[#fcd9a0] bg-[#ffecd4] text-[#a05c00]',
  alertSuccess: 'border border-[#a7f0c8] bg-[#d4f4e2] text-[#1a7a4a]',

  kpiGrid: 'mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  kpiCard: 'relative overflow-hidden rounded-2xl border border-[#bfc7d2] bg-white p-5 shadow-[0_2px_12px_rgba(0,96,150,0.08)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,96,150,0.14)]',
  kpiLabel: 'mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.5px] text-[#3f4851]',
  kpiValue: 'mb-1 text-[24px] font-bold leading-tight tabular-nums',

  // Hộp thoại.
  modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 p-6 backdrop-blur-[2px] animate-fadeIn',
  modal: 'w-full max-w-[520px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,32,53,0.22)] animate-modalIn',
  modalHeader: 'flex items-center gap-3 border-b border-[#e4e9ed] p-6 pb-4',
  modalTitle: 'text-[16px] font-bold leading-tight text-[#171c1f]',
  modalSub: 'mt-0.5 text-[12px] text-[#3f4851]',
  modalBody: 'p-6',
  modalFooter: 'flex justify-end gap-2 border-t border-[#e4e9ed] px-6 py-4',

  // Token tương thích cho component workspace cấp phát qua API.
  chipDone: 'bg-[#d4f4e2] text-[#1a7a4a]',
  chipPending: 'bg-[#fff8e1] text-[#a05c00]',
  chipWarning: 'bg-[#ffecd4] text-[#a05c00]',
  infoGrid: 'grid grid-cols-1 gap-4 border-b border-[#e4e9ed] p-6 md:grid-cols-2',
  metricLabel: 'mb-1 text-[11px] font-bold uppercase tracking-[0.4px] text-[#707882]',
  metricValue: 'text-[13.5px] font-semibold leading-relaxed text-[#171c1f]',
  alertDanger: 'm-6 rounded-lg border border-[#f5c6c6] bg-[#ffdad6] p-4 text-[13px] leading-relaxed text-[#ba1a1a]',
  itemsTableWrap: 'mx-6 my-4 w-[calc(100%-3rem)] overflow-x-auto rounded-lg border border-[#e4e9ed]',
  tableWrap: 'w-full overflow-x-auto rounded-xl border border-[#e4e9ed] bg-white',
  table: 'w-full border-collapse text-left text-[13px]',
  rowHover: 'cursor-pointer transition-colors hover:bg-[#f0f4f8]',
  rowActive: 'bg-[#cee5ff]/55',
  actionRow: 'flex flex-wrap justify-end gap-2 border-t border-[#e4e9ed] px-6 py-4',
  dangerButton: 'inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#ba1a1a] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#93000a] disabled:opacity-50',
  outlineButton: 'inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#006096] px-4 text-[13px] font-semibold text-[#006096] transition-colors hover:bg-[#cee5ff]',
  primaryButton: 'inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#006096] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#004a75] disabled:opacity-50',
  mutedButton: 'inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#bfc7d2] bg-[#f0f4f8] px-4 text-[13px] font-semibold text-[#3f4851] transition-colors hover:bg-[#eaeef2]',
  searchRow: 'mb-4 flex flex-wrap items-center gap-2',
  searchWrap: 'relative min-w-[260px] flex-1',
  filterTab: 'inline-flex min-h-[44px] items-center rounded-lg border border-[#bfc7d2] bg-white px-4 text-[13px] font-semibold text-[#3f4851] transition-colors hover:border-[#006096] hover:text-[#006096]',
  filterTabActive: 'border-[#006096] bg-[#006096] text-white hover:text-white',
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-[#171c1f]/55 p-6 backdrop-blur-[2px]',
  modalCard: 'w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.18)]',
  modalSubtitle: 'mt-2 text-[13px] leading-relaxed text-[#3f4851]',
  textarea: 'mt-4 min-h-[120px] w-full rounded-lg border border-[#bfc7d2] p-3 text-[13.5px] outline-none focus:border-[#006096]',
  modalActions: 'mt-5 flex justify-end gap-2',
  logoWrap: 'flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-xl bg-white',
  brandName: 'text-[15px] font-bold leading-tight text-white',
  brandSubtitle: 'mt-0.5 truncate text-[10px] uppercase tracking-[0.4px] text-white/55',
  navSection: 'flex-1 overflow-y-auto p-3.5',
  navSectionLabel: 'px-2 pb-2 pt-1 text-[9.5px] font-semibold uppercase tracking-[1.2px] text-white/40',
  navItem: 'relative mb-[2px] flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-white/75 transition-all hover:bg-white/10 hover:text-white',
  navItemActive: 'bg-white/15 font-semibold text-white shadow-[inset_3px_0_0_#55d7ed]',
  sidebarUser: 'flex items-center gap-2 border-t border-white/10 bg-black/20 p-4',
  userAvatar: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#55d7ed] text-[12px] font-bold text-[#003d5c]',
  userName: 'truncate text-[12px] font-semibold text-white',
  userRole: 'truncate text-[10px] text-white/65',
  iconButton: 'ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/65 transition-colors hover:border-red-400/40 hover:bg-red-900/30 hover:text-red-300',
  topbar: 'flex h-[58px] min-h-[58px] items-center justify-between border-b border-[#bfc7d2] bg-white px-6',
  topbarTitle: 'truncate text-[15px] leading-tight text-[#171c1f]',
  netBadge: 'inline-flex min-h-[30px] items-center gap-1.5 rounded-full bg-[#d4f4e2] px-3 text-[12px] font-semibold text-[#1a7a4a]',
  topbarRight: 'flex items-center gap-3 text-right',
  topbarUserName: 'text-[12px] font-semibold text-[#171c1f]',
  topbarUserRole: 'text-[10px] text-[#707882]',
  dutyPill: 'inline-flex min-h-[30px] items-center gap-1.5 rounded-full border border-[#bfc7d2] px-3 text-[12px] font-semibold text-[#3f4851]',
  topbarTimeStrong: 'text-[12px] font-semibold capitalize text-[#171c1f]',
  topbarTime: 'text-[10px] text-[#707882]',
} as const;
