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
 *
 * @param input Bộ tham số phải phản ánh đầy đủ query đã gửi tới `GET /api/staff-users`.
 * @returns Tuple bất biến dùng chung cho đọc, invalidate và phân tách các cache entry.
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
 * Hook đọc server state danh sách nhân viên theo filter và phân trang.
 *
 * @param input Từ khóa, filter, trang và kích thước trang cần truy vấn.
 * @returns Query result của React Query, gồm dữ liệu đã parse, loading/error state và retry/query
 * controls cho caller.
 * @remarks `queryKey` thay đổi sẽ tạo cache entry tương ứng; `queryFn` nhận `AbortSignal` để hủy
 * request cũ khi người dùng đổi filter/từ khóa. Hook không tự đặt retry riêng, nên dùng policy của
 * QueryClient hiện tại.
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
 * Hook tạo tài khoản staff và invalidates toàn bộ cache danh sách sau khi thành công.
 *
 * @returns Mutation result để caller gửi `CreateStaffInput`, hiển thị pending/error và nhận
 * envelope credential tạm thời từ backend.
 * @remarks Mutation không tự hiển thị credential hoặc toast; component sở hữu việc bàn giao một
 * lần. Lỗi validation, permission và network được giữ nguyên cho caller.
 */
export const useCreateStaffUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaffUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-users'] }),
  });
};

/**
 * Hook cập nhật tài khoản staff với optimistic lock và refresh cache sau khi thành công.
 *
 * @returns Mutation result nhận `{ userId, input, ifUnmodifiedSince }`; caller chịu trách nhiệm
 * xử lý conflict `STAFF_MODIFIED_SINCE_READ` và field error.
 * @remarks Invalidate toàn bộ query key `staff-users` để các trang/filter không giữ trạng thái cũ.
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
 * Hook reset mật khẩu staff và refresh cache sau khi backend phát hành credential tạm thời.
 *
 * @returns Mutation result nhận `userId` và `reason`; caller tự quyết định cách hiển thị secret
 * một lần và phải dọn state khi dialog đóng.
 * @remarks Hook không retry hoặc lưu credential riêng; lỗi permission, validation và network được
 * trả về cho component.
 */
export const useResetStaffPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetStaffPassword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-users'] }),
  });
};
