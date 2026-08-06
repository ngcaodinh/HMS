import { AdminModal } from './AdminModal';

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

/**
 * Hộp thoại xác nhận dùng chung cho thao tác có thể hủy hoặc không thể hoàn tác trong module Admin.
 * @param title - Tiêu đề mô tả hành động sắp xác nhận.
 * @param description - Cảnh báo/ngữ cảnh do component cha tạo.
 * @param cancelLabel - Nhãn nút hủy, mặc định là `Hủy`.
 * @param confirmLabel - Nhãn nút xác nhận, mặc định là `Xác nhận`.
 * @param onCancel - Callback đóng hộp thoại mà không thực hiện mutation.
 * @param onConfirm - Callback để component cha thực hiện mutation và hiển thị kết quả.
 * @remarks Component chỉ phát callback, không gọi API và không tự quyết định quyền thao tác.
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
