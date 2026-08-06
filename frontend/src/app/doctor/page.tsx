import { DoctorWorkspacePage } from '@/modules/doctor';

/**
 * Route shell cho workspace bác sĩ.
 *
 * @returns Workspace bác sĩ với các trạng thái xác thực, tải worklist và hồ sơ do module xử lý.
 * @remarks Đây là route staff; middleware kiểm tra session/role, còn workspace gọi BFF để tải
 * dữ liệu. Page không tự cấp quyền chỉ vì route được render.
 */
export default function DoctorPage() {
  return <DoctorWorkspacePage />;
}
