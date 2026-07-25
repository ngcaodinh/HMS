import {
  createStaffResultSchema,
  staffListSchema,
  staffUserSchema,
  type CreateStaffResult,
  type StaffList,
  type StaffUser,
} from '../types/staff.schema';
import { apiClient } from '@/shared/api-client';

export type CreateStaffInput = {
  dateOfBirth: string;
  departmentId: string;
  fullName: string;
  gender: 'male' | 'female';
  identityCardNumber: string;
  phoneNumber: string;
  roleCodes: string[];
  supportRequestReference: string;
  username: string;
};

export type UpdateStaffInput = {
  departmentId?: string;
  fullName?: string;
  isActive?: boolean;
  phoneNumber?: string;
  roleCodes?: string[];
  supportRequestReference?: string;
};

/**
 * Lấy danh sách nhân viên và parse response bằng Zod trước khi vào UI.
 */
export const listStaffUsers = async ({
  page,
  q,
  signal,
}: {
  page: number;
  q: string;
  signal?: AbortSignal;
}): Promise<StaffList> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: '20',
  });

  if (q.trim()) params.set('q', q.trim());

  const raw = await apiClient<unknown>(`/api/staff-users?${params.toString()}`, { signal });
  return staffListSchema.parse(raw);
};

/**
 * Tạo nhân viên mới; kết quả có mật khẩu tạm thời chỉ hiển thị một lần.
 */
export const createStaffUser = async (input: CreateStaffInput): Promise<CreateStaffResult> => {
  const raw = await apiClient<unknown>('/api/staff-users', {
    body: input,
    method: 'POST',
  });
  return createStaffResultSchema.parse(raw);
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
  return staffUserSchema.parse(raw);
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
  return createStaffResultSchema.parse(raw);
};
