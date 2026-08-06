import Image from 'next/image';
import { Fragment, type ReactNode } from 'react';

import { SidebarNavItem } from './SidebarNavItem';
import { sidebarStyles as styles } from './sidebar.styles';
import type { SidebarNavSectionConfig, SidebarTone } from './sidebar.types';

type SidebarProps = {
  logoSrc?: string;
  logoAlt?: string;
  brandName?: string;
  tone?: SidebarTone;
  /** Chế độ khai báo - Sidebar tự render <nav> từ danh sách nhóm mục. */
  sections?: SidebarNavSectionConfig[];
  /** Chế độ tự do - dùng khi vùng nav có cấu trúc đặc thù không thể khai báo qua sections
   * (vd: hàng đợi bệnh nhân của Bác sĩ, khối chuyển chế độ cấp cứu của Lễ tân). */
  children?: ReactNode;
  /** Khối avatar/tên/vai trò/đăng xuất hiện có của từng module - Sidebar không viết lại, chỉ nhận nguyên vẹn. */
  footer: ReactNode;
  navAriaLabel?: string;
  className?: string;
  /** Hook thoát hiếm khi cần override responsive/hiển thị của khối footer (vd: ẩn footer trên mobile ở Lễ tân). */
  footerClassName?: string;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Khung sidebar dùng chung cho toàn bộ 8 vai trò trong hệ thống - đồng bộ logo, màu nền, màu active,
 * khoảng cách và hiệu ứng vi mô thay vì mỗi module tự viết lại. Nhận danh sách mục điều hướng qua
 * `sections`, hoặc nội dung tuỳ biến hoàn toàn qua `children` khi cấu trúc màn hình đặc thù không
 * khai báo được dưới dạng danh sách (vd: hàng đợi bệnh nhân, khối chuyển chế độ cấp cứu).
 * @param props - Logo, tên thương hiệu, tông màu (`tone`), danh sách nav hoặc nội dung tuỳ biến, và khối footer.
 * @returns Thẻ <aside> hoàn chỉnh gồm header (logo + tên thương hiệu), vùng điều hướng, và footer.
 */
export function Sidebar({
  brandName = 'HMS-VN',
  children,
  className,
  footer,
  footerClassName,
  logoAlt = 'HMS-VN',
  logoSrc = '/hms-login-logo.png',
  navAriaLabel = 'Điều hướng chính',
  sections,
  tone = 'default',
}: SidebarProps) {
  const isDanger = tone === 'danger';

  return (
    <aside className={cn(styles.aside, isDanger && styles.asideDanger, className)} suppressHydrationWarning>
      <div className={styles.header}>
        <div className={styles.logoWrap}>
          <Image
            alt={logoAlt}
            className="h-full w-full object-cover"
            height={34}
            priority
            src={logoSrc}
            width={34}
          />
        </div>
        <div className="min-w-0">
          <p className={styles.brandName}>{brandName}</p>
          <p className={styles.brandSubtitle}>Bệnh viện Da liễu Trung ương</p>
        </div>
      </div>

      {sections ? (
        <nav aria-label={navAriaLabel} className={styles.navArea}>
          {sections.map((section, sectionIndex) => (
            <Fragment key={section.id}>
              {section.label && (
                <p className={cn(styles.navSectionLabel, sectionIndex > 0 && 'mt-4')}>{section.label}</p>
              )}
              {section.items.map((item) => (
                <SidebarNavItem key={item.id} {...item} />
              ))}
            </Fragment>
          ))}
        </nav>
      ) : (
        children
      )}

      <div className={cn(styles.footer, isDanger && styles.footerDanger, footerClassName)}>{footer}</div>
    </aside>
  );
}
