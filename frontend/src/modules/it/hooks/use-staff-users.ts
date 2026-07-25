import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createStaffUser,
  listStaffUsers,
  resetStaffPassword,
  updateStaffUser,
  type CreateStaffInput,
  type UpdateStaffInput,
} from '../api/staff-api';

type StaffUsersQueryInput = {
  isActive?: boolean;
  page: number;
  pageSize?: number;
  q: string;
};

/**
 * Query key ổn định cho cache danh sách nhân viên theo trang, filter và từ khóa.
 */
export const staffUsersQueryKey = ({ isActive, page, pageSize = 20, q }: StaffUsersQueryInput) =>
  ['staff-users', page, pageSize, q, isActive] as const;

/**
 * Hook đọc danh sách nhân viên, truyền AbortSignal để hủy request khi query đổi.
 */
export const useStaffUsers = ({ isActive, page, pageSize, q }: StaffUsersQueryInput) =>
  useQuery({
    queryFn: ({ signal }) => listStaffUsers({ isActive, page, pageSize, q, signal }),
    queryKey: staffUsersQueryKey({ isActive, page, pageSize, q }),
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
