// Tao query key on dinh theo principal de khong dung lai du lieu ho so giua cac phien bac si.
export const doctorWorklistQueryKey = (doctorId: string | null) =>
  ['medical-records', 'worklist', doctorId] as const;

export const medicalRecordDetailQueryKey = (viewerId: string | null, recordId: string | null) =>
  ['medical-records', 'detail', viewerId, recordId] as const;

// Xac dinh query medical-record can refresh sau mutation ghi ho so kham.
export function shouldInvalidateMedicalRecordQuery(recordId: string, queryKey: readonly unknown[]) {
  if (queryKey[0] !== 'medical-records') return false;
  if (queryKey[1] === 'worklist') return true;

  return queryKey[1] === 'detail' && queryKey[3] === recordId;
}
