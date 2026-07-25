import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createStaffUser,
  listStaffUsers,
  resetStaffPassword,
  updateStaffUser,
  type CreateStaffInput,
  type UpdateStaffInput,
} from '../api/staff-api';

/**
 * Query key ổn định cho cache danh sách nhân viên theo trang và từ khóa.
 */
export const staffUsersQueryKey = (page: number, q: string) => ['staff-users', page, q] as const;

/**
 * Hook đọc danh sách nhân viên, truyền AbortSignal để hủy request khi query đổi.
 */
export const useStaffUsers = ({ page, q }: { page: number; q: string }) =>
  useQuery({
    queryFn: ({ signal }) => listStaffUsers({ page, q, signal }),
    queryKey: staffUsersQueryKey(page, q),
  });

/**
 * Mutation tạo nhân viên và refresh mọi trang staff-users sau khi thành công.
 */
export const useCreateStaffUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaffUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-users'] }),
  });
};

/**
 * Mutation cập nhật nhân viên và refresh cache để tránh hiển thị trạng thái cũ.
 */
export const useUpdateStaffUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      ifUnmodifiedSince: string;
      input: UpdateStaffInput;
      userId: string;
    }) => updateStaffUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-users'] }),
  });
};

/**
 * Mutation reset mật khẩu; caller tự quyết định cách hiển thị secret một lần.
 */
export const useResetStaffPassword = () =>
  useMutation({
    mutationFn: resetStaffPassword,
  });
