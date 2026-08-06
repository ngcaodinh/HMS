import { NurseWorkspacePage } from '@/modules/nurse';

export const metadata = {
  title: 'Nurse | HMS',
  description: 'Workspace for nurses in HMS.',
};

/**
 * Route shell cho workspace điều dưỡng.
 *
 * @returns Workspace điều dưỡng; module quản lý dữ liệu giường, y lệnh, sinh hiệu và các state UI.
 * @remarks Middleware bảo vệ route staff; page không tự cấp quyền, còn mutation và permission
 * cuối cùng do API backend quyết định.
 */
export default function NursePage() {
  return <NurseWorkspacePage />;
}
