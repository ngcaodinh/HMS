import { LabWorkspacePage } from '@/modules/lab';

/**
 * Route shell cho phân hệ xét nghiệm.
 *
 * @returns Workspace xét nghiệm; module quản lý xác thực, tải queue và các trạng thái UI.
 * @remarks Route staff được middleware kiểm tra session/role; component workspace tiếp tục đọc
 * principal qua BFF và backend mới là nguồn quyết định dữ liệu/permission.
 */
export default function Page() {
  return <LabWorkspacePage />;
}
