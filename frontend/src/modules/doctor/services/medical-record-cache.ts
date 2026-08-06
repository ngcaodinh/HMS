/**
 * Tạo khóa React Query cho worklist theo tài khoản bác sĩ đang đăng nhập.
 * @param doctorId Mã người dùng; `null` giữ namespace riêng khi session chưa sẵn sàng.
 * @returns Tuple khóa ổn định cho truy vấn `medical-records/worklist`.
 * @remarks Khóa tách dữ liệu giữa các phiên; phạm vi hồ sơ thực tế vẫn do backend kiểm soát.
 */
export const doctorWorklistQueryKey = (doctorId: string | null) =>
  ['medical-records', 'worklist', doctorId] as const;

/**
 * Tạo khóa cho chi tiết hồ sơ theo người xem và hồ sơ đang mở.
 * @param viewerId Mã người dùng hiện tại, dùng để tách cache giữa các phiên.
 * @param recordId Mã hồ sơ; `null` được giữ trong khóa khi chưa chọn bệnh nhân.
 * @returns Tuple khóa ổn định cho truy vấn chi tiết hồ sơ.
 */
export const medicalRecordDetailQueryKey = (viewerId: string | null, recordId: string | null) =>
  ['medical-records', 'detail', viewerId, recordId] as const;

/**
 * Xác định query hồ sơ cần làm mới sau mutation ghi nhận dữ liệu khám.
 * @param recordId Mã hồ sơ vừa bị mutation.
 * @param queryKey Khóa React Query cần kiểm tra.
 * @returns `true` cho worklist hoặc chi tiết đúng hồ sơ; `false` cho query khác.
 * @remarks Không làm mới toàn bộ cache để tránh trộn dữ liệu giữa hồ sơ hoặc phiên bác sĩ.
 */
export function shouldInvalidateMedicalRecordQuery(recordId: string, queryKey: readonly unknown[]) {
  if (queryKey[0] !== 'medical-records') return false;
  if (queryKey[1] === 'worklist') return true;

  return queryKey[1] === 'detail' && queryKey[3] === recordId;
}
