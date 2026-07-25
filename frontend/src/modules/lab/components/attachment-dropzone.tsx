import { useRef, useState } from 'react';

import { labWorkspaceStyles as styles } from '../pages/workspace/lab-workspace.styles';
import { downloadAttachmentUrl, useUploadAttachment } from '../services/lab-test-api';
import type { LabTestAttachment } from '../types/lab-test.types';
import { AssetIcon } from './shared';

interface AttachmentDropzoneProps {
  labTestId: string;
  onUploaded: (attachment: LabTestAttachment) => void;
  uploaded: LabTestAttachment | null;
}

const ACCEPTED_TYPES = 'application/pdf,image/png,image/jpeg';

export function AttachmentDropzone({ labTestId, onUploaded, uploaded }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const uploadMutation = useUploadAttachment();

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
        <button className="text-xs font-semibold text-[#ba1a1a]" onClick={() => onUploaded(null as unknown as LabTestAttachment)} type="button">
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
        <AssetIcon className="h-8 w-8 opacity-50" name="icon-save.svg" />
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
