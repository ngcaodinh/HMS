import { AdminModal } from './admin-modal';

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

/**
 * Modal xác nhận dùng chung cho các thao tác xóa/khóa dữ liệu demo trong module Admin, đồng bộ
 * phong cách với hộp thoại khóa/mở khóa tài khoản của trang KTV IT (title + mô tả + 2 nút hành động).
 * Không có gọi API - chỉ phát sự kiện `onConfirm`/`onCancel` để component cha xử lý state cục bộ.
 */
export function ConfirmDialog({
  cancelLabel = 'Hủy',
  confirmLabel = 'Xác nhận',
  description,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <AdminModal maxWidthClassName="max-w-[440px]" onClose={onCancel} title={title} titleId="admin-confirm-dialog-title">
      <p className="text-xs leading-5 text-[#707882]">{description}</p>
      <div className="mt-5 flex justify-end gap-2.5">
        <button
          className="rounded-lg border border-[#bfc7d2] px-4 py-2 text-xs font-semibold text-[#3f4851] transition hover:bg-[#f0f4f8]"
          onClick={onCancel}
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          className="rounded-lg bg-[#ba1a1a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#a01616] active:scale-[0.98]"
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}
