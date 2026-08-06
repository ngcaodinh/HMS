/** Props của overlay; fullName chỉ để hiển thị, còn mustChangePassword quyết định nhãn. */
type LoginSuccessOverlayProps = {
  fullName: string;
  mustChangePassword: boolean;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Hiển thị trạng thái đăng nhập thành công trong lúc form điều hướng tới màn hình tiếp theo.
 *
 * @param props - Tên hiển thị từ principal và trạng thái bắt buộc đổi mật khẩu.
 * @param props.fullName - Tên hiển thị đã được backend trả về sau khi xác thực.
 * @param props.mustChangePassword - Chọn thông báo đổi mật khẩu hoặc đăng nhập thành công.
 * @returns Modal trạng thái thành công có chỉ báo đang chuyển hướng.
 * @remarks
 * Overlay chỉ có trạng thái success/loading chuyển tiếp; không tự gọi API, không có callback đóng
 * và không tự cấp quyền. `LoginForm` sở hữu timeout cùng `router.replace`; backend vẫn là nơi bảo
 * đảm session và authorization.
 */
export function LoginSuccessOverlay({ fullName, mustChangePassword }: LoginSuccessOverlayProps) {
  return (
    <div
      aria-live="polite"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d4f4e2] text-[#1a7a4a]">
          <CheckIcon />
        </div>
        <h2 className="mt-5 text-xl font-bold text-[#171c1f]">
          {mustChangePassword ? 'Vui lòng đổi mật khẩu trước khi tiếp tục' : 'Đăng nhập thành công!'}
        </h2>
        <p className="mt-2 text-sm text-[#3f4851]">Xin chào, {fullName}</p>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#707882]">
          <SpinnerIcon />
          Đang chuyển hướng...
        </p>
      </div>
    </div>
  );
}

