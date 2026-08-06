import { DirectorDashboardPage } from '@/modules/dashboard';

/** Mở dashboard giám đốc ở phân hệ audit; quyền vẫn do workspace/backend kiểm tra. */
export default function DirectorAuditLogRoute() {
  return <DirectorDashboardPage section="audit" />;
}
