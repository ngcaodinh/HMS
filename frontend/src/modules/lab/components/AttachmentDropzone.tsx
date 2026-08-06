import { useRef, useState } from 'react';

import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import { downloadAttachmentUrl, useUploadAttachment } from '../services/lab-test-api';
import type { LabTestAttachment } from '../types/lab-test.types';
import { AssetIcon } from './SharedComponents';

interface AttachmentDropzoneProps {
  labTestId: string;
  onUploaded: (attachment: LabTestAttachment) => void;
  uploaded: LabTestAttachment | null;
}

/** Gợi ý MIME cho input; server mới kiểm tra MIME thực và giới hạn kích thước 1 byte–10 MB. */
const ACCEPTED_TYPES = 'application/pdf,image/png,image/jpeg';

/**
 * Upload tệp kết quả cho đúng phiếu xét nghiệm đang nhập.
 *
 * @param props.labTestId Mã phiếu được gửi làm owner của attachment.
 * @param props.onUploaded Callback cập nhật attachment đã upload ở component cha; dùng sentinel null
 * khi người dùng chọn "Đổi tệp" để xóa lựa chọn hiện tại.
 * @param props.uploaded Attachment hiện tại; `null` hiển thị dropzone, có giá trị hiển thị link tải.
 * @returns Dropzone ở trạng thái chờ/loading/error hoặc chip tệp sau khi tải lên thành công.
 * @remarks Input chỉ giới hạn gợi ý PDF/PNG/JPEG và hiển thị lỗi upload; backend quyết định MIME,
 * kích thước, owner và quyền `attachment.upload`. Link tải đi qua proxy có xác thực/audit.
 */
export function AttachmentDropzone({ labTestId, onUploaded, uploaded }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const uploadMutation = useUploadAttachment();

  /** Nhận tệp từ input hoặc drag/drop, gửi mutation và báo thành công/lỗi cho component cha. */
  function handleFile(file: File | undefined) {
    if (!file) return;
    setErrorMessage(null);
    uploadMutation.mutate(
      { ownerId: labTestId, file },
      {
        onSuccess: (result) =>
          onUploaded({
            attachmentId: result.attachmentId,
            fileType: result.fileType,
            originalName: result.originalName,
            uploadedAt: result.uploadedAt,
          }),
        onError: () => setErrorMessage('Tải tệp thất bại — chỉ chấp nhận PDF/PNG/JPEG, tối đa 10MB.'),
      },
    );
  }

  if (uploaded) {
    return (
      <div className={styles.attachmentChip}>
        <AssetIcon className="h-4 w-4" name="icon-lab-result.svg" />
        <a className="flex-1 truncate text-[#006096] hover:underline" href={downloadAttachmentUrl(uploaded.attachmentId)} rel="noreferrer" target="_blank">
          {uploaded.originalName}
        </a>
        {/* Callback null là hợp đồng hiện tại để component cha reset tệp trước lần upload kế tiếp. */}
        <button
          className="rounded text-xs font-semibold text-[#ba1a1a] transition-colors hover:text-[#93000a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]/30"
          onClick={() => onUploaded(null as unknown as LabTestAttachment)}
          type="button"
        >
          Đổi tệp
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={styles.dropzone}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        role="button"
        style={isDragging ? { borderColor: '#006096' } : undefined}
      >
        <AssetIcon className="h-8 w-8 brightness-0 opacity-50" name="icon-save.svg" />
        <p className="text-[13px] font-semibold text-[#3f4851]">
          {uploadMutation.isPending ? 'Đang tải lên...' : 'Kéo thả hoặc click để tải lên'}
        </p>
        <p className="text-[11px] text-[#8a8f96]">PDF, PNG, JPEG — tối đa 10MB</p>
      </div>
      <input
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      {errorMessage && <p className="mt-2 text-xs text-[#ba1a1a]">{errorMessage}</p>}
    </div>
  );
}
