import { KioskRootPage } from '@/modules/queue';

/** Route kiosk công khai; không tự xác thực và giao toàn bộ hiển thị cho KioskRootPage. */
export default function KioskPage() {
  return <KioskRootPage />;
}
