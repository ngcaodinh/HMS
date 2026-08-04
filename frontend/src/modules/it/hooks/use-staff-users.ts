import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createStaffUser,
  listStaffUsers,
  resetStaffPassword,
  updateStaffUser,
  type CreateStaffInput,
  type UpdateStaffInput,
} from '../api/staff-api';
import type { StaffListFilter } from '../types/staff.schema';

type StaffUsersQueryInput = StaffListFilter & {
  page: number;
  pageSize?: number;
  q: string;
};

/**
 * Query key ổn định cho cache danh sách nhân viên theo trang, filter và từ khóa.
 */
export const staffUsersQueryKey = ({
  departmentId,
  isActive,
  page,
  pageSize = 20,
  q,
  roleCode,
}: StaffUsersQueryInput) =>
  ['staff-users', page, pageSize, q, departmentId, isActive, roleCode] as const;

/**
 * Hook đọc danh sách nhân viên, truyền AbortSignal để hủy request khi query đổi.
 */
export const useStaffUsers = ({
  departmentId,
  isActive,
  page,
  pageSize,
  q,
  roleCode,
}: StaffUsersQueryInput) =>
  useQuery({
    queryFn: ({ signal }) =>
      listStaffUsers({ departmentId, isActive, page, pageSize, q, roleCode, signal }),
    queryKey: staffUsersQueryKey({ departmentId, isActive, page, pageSize, q, roleCode }),
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
    mutationFn: (input: { ifUnmodifiedSince: string; input: UpdateStaffInput; userId: string }) =>
      updateStaffUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-users'] }),
  });
};

/**
 * Mutation reset mật khẩu; caller tự quyết định cách hiển thị secret một lần.
 */
export const useResetStaffPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetStaffPassword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-users'] }),
  });
};
