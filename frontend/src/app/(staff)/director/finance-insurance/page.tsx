import { DirectorDashboardPage } from '@/modules/dashboard';

/** Mở dashboard giám đốc ở phân hệ tài chính/BHYT; quyền không được suy diễn từ UI. */
export default function DirectorFinanceInsuranceRoute() {
  return <DirectorDashboardPage section="finance" />;
}
