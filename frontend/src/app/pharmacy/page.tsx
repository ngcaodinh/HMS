import { Metadata } from 'next';
import { PharmacyWorkspace } from '@/modules/pharmacy';

export const metadata: Metadata = {
  title: 'Quản lý Dược & Nhà thuốc | HMS-VN',
  description: 'Phân hệ Quản lý Dược, Cấp phát thuốc theo đơn & Quản lý kho FEFO cho Dược sĩ.',
};

export default function PharmacyPage() {
  return <PharmacyWorkspace />;
}
