import { DirectorDashboardPage } from '@/modules/dashboard';

/** Mở dashboard giám đốc ở phân hệ giường bệnh; route chỉ truyền lựa chọn hiển thị. */
export default function DirectorBedPerformanceRoute() {
  return <DirectorDashboardPage section="beds" />;
}
