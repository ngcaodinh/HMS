/** Phần dữ liệu tối thiểu của worklist cần để kiểm tra hồ sơ đang được chọn. */
type WorklistSnapshot = {
  data: Array<{ recordId: string }>;
};

/**
 * Kiểm tra hồ sơ đang chọn có còn thuộc worklist server của bác sĩ hiện tại không.
 *
 * @param selectedRecordId ID hồ sơ đang được giữ trong local state.
 * @param worklist Snapshot worklist mới nhất; khi chưa có dữ liệu thì chưa reset.
 * @returns `true` khi hồ sơ đã chọn bị loại khỏi worklist và cần xóa khỏi workspace.
 */
export function shouldResetSelectedRecord(
  selectedRecordId: string | null,
  worklist?: WorklistSnapshot | null,
) {
  if (!selectedRecordId || !worklist) return false;

  return !worklist.data.some((item) => item.recordId === selectedRecordId);
}
