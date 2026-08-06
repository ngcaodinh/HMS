import { LabWorkspacePage } from '@/modules/lab';

export const metadata = {
  title: 'Lab Technician | HMS',
  description: 'Workspace for lab technicians in HMS.',
};

/**
 * Route shell cho workspace kỹ thuật viên xét nghiệm.
 *
 * @returns Workspace xét nghiệm với loading/error/empty/success state do module phụ trách.
 * @remarks Middleware giới hạn route staff theo role; page chỉ nối route với workspace và không
 * tự thay thế authorization của backend.
 */
export default function LabTechnicianPage() {
  return <LabWorkspacePage />;
}
