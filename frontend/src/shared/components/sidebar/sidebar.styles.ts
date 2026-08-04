/**
 * Hằng số Tailwind chuẩn dùng chung cho Sidebar - đồng bộ màu nền, màu active, logo, spacing
 * trên toàn bộ 8 vai trò. Giá trị lấy theo chuẩn thực tế đã áp dụng đa số (bg #001d32, accent
 * #55d7ed khớp hms.accent trong tailwind.config.js), không phải theo file lệch chuẩn.
 */
export const sidebarStyles = {
  aside:
    'flex shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#001d32] text-white lg:h-screen lg:w-[240px]',
  asideDanger: 'border-[#7f1010] bg-[#1a0000]',
  header: 'flex h-[64px] shrink-0 items-center gap-3 border-b border-white/10 px-4',
  logoWrap:
    'relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#006096] shadow-[0_2px_4px_rgba(0,96,150,0.3)]',
  brandName: 'text-[15px] font-bold leading-[18.75px] text-white',
  brandSubtitle:
    'mt-0.5 whitespace-nowrap text-[10px] uppercase leading-[15px] tracking-[0.4px] text-white/55',
  navArea: 'flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-3 py-4',
  navSectionLabel:
    'px-2 pb-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-white/40',
  navItem:
    'group flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-medium text-white/40 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55d7ed]/60',
  navItemActive: 'border-l-4 border-[#55d7ed] bg-white/15 pl-2 font-semibold text-white shadow-sm',
  navBadge: 'ml-auto shrink-0 rounded-full bg-[#c62828] px-1.5 py-0.5 text-[10px] font-bold text-white',
  footer: 'mt-auto flex shrink-0 items-center gap-3 border-t border-white/10 bg-black/20 px-4 py-4',
  footerDanger: 'border-[#301919]',
} as const;
