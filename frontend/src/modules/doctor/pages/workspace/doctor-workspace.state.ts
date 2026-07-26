type WorklistSnapshot = {
  data: Array<{ recordId: string }>;
};

// Kiem tra ho so dang chon co con thuoc worklist cua bac si hien tai hay khong.
export function shouldResetSelectedRecord(
  selectedRecordId: string | null,
  worklist?: WorklistSnapshot | null,
) {
  if (!selectedRecordId || !worklist) return false;

  return !worklist.data.some((item) => item.recordId === selectedRecordId);
}
