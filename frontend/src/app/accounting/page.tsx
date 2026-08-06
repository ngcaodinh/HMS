import { AccountingWorkspacePage } from '@/modules/invoice';

/**
 * Route shell cho workspace kế toán.
 *
 * @returns Workspace kế toán; trạng thái loading/hydration và nội dung nghiệp vụ do module quản lý.
 * @remarks Route staff được middleware bảo vệ; việc render page không thay thế authorization ở
 * backend. Workspace chịu trách nhiệm hiển thị các trạng thái lỗi, rỗng và thành công của mình.
 */
export default function AccountingPage() {
  return <AccountingWorkspacePage />;
}
