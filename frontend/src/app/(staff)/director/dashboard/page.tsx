import { DirectorDashboardPage } from '@/modules/dashboard';

/**
 * Route shell cho dashboard điều hành của Director.
 *
 * @returns Page client hiển thị dữ liệu aggregate read-only; loading/error/empty được xử lý
 * trong `DirectorDashboardPage` theo từng section.
 * @remarks Quyền truy cập và audit của các request do backend Director API quyết định; route
 * này chỉ nối App Router với module dashboard và không tự chứa dữ liệu bệnh nhân.
 */
export default function DirectorDashboardRoute() {
  return <DirectorDashboardPage />;
}
