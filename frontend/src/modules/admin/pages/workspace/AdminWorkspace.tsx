'use client';

import { useEffect, useState } from 'react';

import { AppToast } from '@/shared/components/AppToast';
import { LogoutButton } from '@/shared/auth/LogoutButton';
import { RoleIcon } from '@/shared/components/RoleIcon';
import { Sidebar as SharedSidebar } from '@/shared/components/sidebar/Sidebar';
import type { SidebarNavSectionConfig } from '@/shared/components/sidebar/sidebar.types';
import { useAppToast } from '@/shared/hooks/use-app-toast';

import { AdminIcon } from '../../components/AdminIcon';
import {
  initialAuditLog,
  initialDepartmentLoad,
  initialHourlyPatientFlow,
  initialKpiCards,
  initialPaymentMethodBreakdown,
  initialRevenueSnapshot,
} from '../../constants/admin-mock.data';
import { useBedDirectory } from '../../hooks/use-bed-directory';
import { useServiceCatalog } from '../../hooks/use-service-catalog';
import { useStaffDirectory } from '../../hooks/use-staff-directory';
import { adminNavSections, adminScreenMeta, type AdminScreen } from './admin-workspace.data';
import { adminWorkspaceStyles as styles } from './admin-workspace.styles';
import { AuditSection } from './sections/AuditSection';
import { BillingSection } from './sections/BillingSection';
import { CatalogSection } from './sections/CatalogSection';
import { OverviewSection } from './sections/OverviewSection';
import { StaffSection } from './sections/StaffSection';

type AdminPrincipal = {
  fullName: string;
  id: string;
  roleCodes: string[];
  username: string;
};

/** Thông tin đã được page guard xác thực; workspace chỉ dùng để hiển thị người đang đăng nhập. */
type AdminWorkspaceProps = {
  principal: AdminPrincipal;
};

/**
 * Sidebar điều hướng giữa các màn hình nghiệp vụ của Admin.
 * @param activeScreen - Tab đang chọn, mặc định do workspace sở hữu.
 * @param onScreenChange - Callback cập nhật tab nội bộ, không điều hướng route.
 * @param principal - Thông tin hiển thị ở footer và nút đăng xuất.
 * @remarks Sidebar chỉ điều khiển khả năng hiển thị; authorization cuối cùng vẫn thuộc backend/page guard.
 */
function AdminSidebar({
  activeScreen,
  onScreenChange,
  principal,
}: {
  activeScreen: AdminScreen;
  onScreenChange: (screen: AdminScreen) => void;
  principal: AdminPrincipal;
}) {
  const sections: SidebarNavSectionConfig[] = adminNavSections.map((section) => ({
    id: section.title,
    items: section.items.map((item) => ({
      icon: (
        <AdminIcon
          className={`h-5 w-5 shrink-0 ${item.id === activeScreen ? 'text-[#55d7ed]' : 'text-white/65'}`}
          name={item.icon}
        />
      ),
      id: item.label,
      isActive: item.id === activeScreen,
      label: item.label,
      onClick: () => onScreenChange(item.id),
    })),
    label: section.title,
  }));

  return (
    <SharedSidebar
      footer={
        <>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006096] text-sm font-bold text-white shadow transition-transform duration-200 hover:scale-105">
            <RoleIcon role="admin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5 text-white">
              {principal.fullName || 'Quản trị viên'}
            </p>
            <p className="truncate text-[11px] font-medium leading-4 text-white/50">Quản trị hệ thống</p>
          </div>
          <LogoutButton
            ariaLabel="Đăng xuất"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Đăng xuất"
          >
            <AdminIcon className="h-4 w-4" name="logOut" />
          </LogoutButton>
        </>
      }
      navAriaLabel="Điều hướng quản trị hệ thống"
      sections={sections}
    />
  );
}

/**
 * Thanh tiêu đề hiển thị metadata của tab và đồng hồ phía máy khách.
 * @param activeScreen - Tab dùng để chọn title/subtitle từ `adminScreenMeta`.
 * @remarks Đồng hồ đồng bộ với `window` mỗi giây và phải dọn interval khi component unmount.
 */
function AdminTopbar({ activeScreen }: { activeScreen: AdminScreen }) {
  const [now, setNow] = useState(() => new Date());
  const meta = adminScreenMeta[activeScreen];

  useEffect(() => {
    // Đồng bộ đồng hồ hiển thị với window; cleanup interval khi topbar unmount để tránh timer treo.
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className={styles.topbar}>
      <div>
        <h1 className="text-xl font-bold leading-7 text-sky-800">{meta.title}</h1>
        <p className="mt-1 text-sm leading-5 text-slate-500">{meta.subtitle}</p>
      </div>
      <div className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-xs leading-4 text-slate-600">
          {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(now)}
        </span>
      </div>
    </header>
  );
}

/**
 * Workspace quản trị bệnh viện với các tab tổng quan, nhân sự, danh mục, billing và audit.
 * @param principal - Định danh tài khoản đã được page guard xác thực, chỉ dùng để hiển thị.
 * @remarks
 * - Snapshot tổng quan, doanh thu và audit lấy từ `admin-mock.data`; staff/catalog/bed thay đổi trên state cục bộ.
 * - Loading, error và forbidden không do workspace này tải dữ liệu; page guard/backend quyết định access trước khi render.
 * - CRUD cục bộ dispatch qua hook; lỗi validation hiển thị inline và thao tác thành công phát toast, không tạo API mutation.
 */
export function AdminWorkspace({ principal }: AdminWorkspaceProps) {
  const [activeScreen, setActiveScreen] = useState<AdminScreen>('overview');
  const [staffList, dispatchStaffDirectory] = useStaffDirectory();
  const [catalogList, dispatchServiceCatalog] = useServiceCatalog();
  const [bedList, dispatchBedDirectory] = useBedDirectory();
  const { hideToast, showToast, toast } = useAppToast();

  return (
    <main className={styles.shell}>
      <AdminSidebar activeScreen={activeScreen} onScreenChange={setActiveScreen} principal={principal} />
      <section className={styles.workspace}>
        <AdminTopbar activeScreen={activeScreen} />
        <div className={styles.content}>
          <div className={styles.contentInner}>
            {activeScreen === 'overview' ? (
              <OverviewSection
                snapshot={{
                  departmentLoad: initialDepartmentLoad,
                  hourlyPatientFlow: initialHourlyPatientFlow,
                  kpiCards: initialKpiCards,
                }}
              />
            ) : null}
            {activeScreen === 'staff' ? (
              <StaffSection
                dispatchStaffDirectory={dispatchStaffDirectory}
                showToast={showToast}
                staffList={staffList}
              />
            ) : null}
            {activeScreen === 'catalog' ? (
              <CatalogSection
                catalogList={catalogList}
                dispatchServiceCatalog={dispatchServiceCatalog}
                showToast={showToast}
              />
            ) : null}
            {activeScreen === 'billing' ? (
              <BillingSection
                beds={bedList}
                dispatchBedDirectory={dispatchBedDirectory}
                paymentBreakdown={initialPaymentMethodBreakdown}
                revenue={initialRevenueSnapshot}
                showToast={showToast}
              />
            ) : null}
            {activeScreen === 'audit' ? <AuditSection auditLog={initialAuditLog} /> : null}
          </div>
        </div>
        <footer className={styles.footer}>© 2026 HMS-VN Solution. All rights reserved.</footer>
      </section>
      <AppToast centered message={toast.message} onClose={hideToast} tone={toast.tone} />
    </main>
  );
}
