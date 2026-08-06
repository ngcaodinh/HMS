import { DirectorDashboardPage } from '@/modules/dashboard';

/** Mở dashboard giám đốc ở phân hệ tồn kho dược. */
export default function DirectorPharmacyInventoryRoute() {
  return <DirectorDashboardPage section="inventory" />;
}
