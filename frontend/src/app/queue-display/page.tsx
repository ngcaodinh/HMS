import { DarkQueueDisplayPage } from '@/modules/queue';

/**
 * Route public cho màn hình gọi số, không yêu cầu JWT ở page boundary.
 *
 * @returns Màn hình queue realtime; module quản lý snapshot, kết nối socket và fallback hiển thị.
 * @remarks Dữ liệu bảng được giới hạn ở thông tin hàng đợi công khai, không phải hồ sơ bệnh nhân.
 */
export default function Page() {
  return <DarkQueueDisplayPage />;
}
