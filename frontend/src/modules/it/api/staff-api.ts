import { z } from 'zod';

import { ApiError, apiClient } from '@/shared/api-client';

import {
  createStaffResultSchema,
  staffListSchema,
  staffUserSchema,
  type CreateStaffInput,
  type CreateStaffResult,
  type StaffList,
  type StaffListFilter,
  type StaffUser,
  type UpdateStaffInput,
} from '../types/staff.schema';

export type { CreateStaffInput, UpdateStaffInput };

/**
 * Parse dữ liệu trả về từ backend tại feature boundary để phát hiện drift hợp đồng sớm.
 */
const parseApiData = <T>(schema: z.ZodType<T>, raw: unknown): T => {
  try {
    return schema.parse(raw);
  } catch {
    throw new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'Phản hồi từ hệ thống không đúng hợp đồng dữ liệu',
      status: 0,
    });
  }
};

/**
 * Lấy danh sách nhân viên và parse response bằng Zod trước khi vào UI.
 */
export const listStaffUsers = async ({
  departmentId,
  isActive,
  page,
  pageSize = 20,
  q,
  roleCode,
  signal,
}: {
  signal?: AbortSignal;
} & StaffListFilter & {
    page: number;
    pageSize?: number;
    q: string;
  }): Promise<StaffList> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (isActive !== undefined) params.set('isActive', String(isActive));
  if (departmentId) params.set('departmentId', departmentId);
  if (q.trim()) params.set('q', q.trim());
  if (roleCode) params.set('roleCode', roleCode);

  const raw = await apiClient<unknown>(`/api/staff-users?${params.toString()}`, { signal });
  return parseApiData(staffListSchema, raw);
};

/**
 * Tạo nhân viên mới; kết quả có mật khẩu tạm thời chỉ hiển thị một lần.
 */
export const createStaffUser = async (input: CreateStaffInput): Promise<CreateStaffResult> => {
  const raw = await apiClient<unknown>('/api/staff-users', {
    body: input,
    method: 'POST',
  });
  return parseApiData(createStaffResultSchema, raw);
};

/**
 * Cập nhật nhân viên với If-Unmodified-Since để tránh ghi đè dữ liệu cũ.
 */
export const updateStaffUser = async ({
  ifUnmodifiedSince,
  input,
  userId,
}: {
  ifUnmodifiedSince: string;
  input: UpdateStaffInput;
  userId: string;
}): Promise<StaffUser> => {
  const raw = await apiClient<unknown>(`/api/staff-users/${userId}`, {
    body: input,
    headers: {
      'If-Unmodified-Since': ifUnmodifiedSince,
    },
    method: 'PATCH',
  });
  return parseApiData(staffUserSchema, raw);
};

/**
 * Reset mật khẩu nhân viên và parse envelope chứa secret tạm thời.
 */
export const resetStaffPassword = async ({
  reason,
  userId,
}: {
  reason: string;
  userId: string;
}): Promise<CreateStaffResult> => {
  const raw = await apiClient<unknown>(`/api/staff-users/${userId}/password-resets`, {
    body: { reason },
    method: 'POST',
  });
  return parseApiData(createStaffResultSchema, raw);
};
