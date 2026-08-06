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
 * Parse dữ liệu trả về tại feature boundary để phát hiện drift hợp đồng trước khi vào UI.
 *
 * @param schema Zod schema tương ứng với response của endpoint.
 * @param raw JSON chưa tin cậy nhận từ BFF.
 * @returns Dữ liệu đã parse theo đúng kiểu của schema.
 * @throws `ApiError` với mã `INVALID_RESPONSE` nếu response không khớp contract.
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
 * Lấy danh sách nhân viên qua BFF và chuẩn hóa response phân trang trước khi vào UI.
 *
 * @param page Trang hiện tại, bắt đầu từ 1.
 * @param pageSize Số item mỗi trang; mặc định 20.
 * @param q Từ khóa tìm kiếm, được trim trước khi đưa vào query string.
 * @param departmentId Filter theo khoa/phòng, tùy chọn.
 * @param isActive Filter theo trạng thái active/locked, tùy chọn.
 * @param roleCode Filter theo role code, tùy chọn.
 * @param signal AbortSignal để hủy request khi query của React Query đổi.
 * @returns Danh sách staff đã parse theo `staffListSchema`.
 * @remarks Endpoint `GET /api/staff-users` chuyển tiếp tới backend; backend quyết định
 * `staff.read`, phạm vi role và nội dung dữ liệu trả về. Lỗi HTTP từ `apiClient` và lỗi contract
 * từ `parseApiData` đều được đưa lên caller.
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
 * Tạo tài khoản nhân viên qua BFF và nhận user cùng credential tạm thời để bàn giao một lần.
 *
 * @param input Payload đã qua form schema, gồm thông tin staff và một role.
 * @returns Envelope `user` và `temporaryPassword` đã parse.
 * @remarks Endpoint `POST /api/staff-users`; backend quyết định validation, `staff.create`, audit
 * và việc credential tạm thời có được phát hành. Lỗi validation/permission/network được ném lên
 * để form phân biệt field error và system error.
 */
export const createStaffUser = async (input: CreateStaffInput): Promise<CreateStaffResult> => {
  const raw = await apiClient<unknown>('/api/staff-users', {
    body: input,
    method: 'POST',
  });
  return parseApiData(createStaffResultSchema, raw);
};

/**
 * Cập nhật tài khoản với optimistic lock để tránh ghi đè dữ liệu đã thay đổi ở phiên khác.
 *
 * @param userId Định danh tài khoản trên backend.
 * @param input Các field PATCH đã được form schema chuẩn hóa.
 * @param ifUnmodifiedSince `updatedAt` của bản ghi lúc UI đọc; gửi qua header cùng tên.
 * @returns Tài khoản staff sau khi backend cập nhật và parse.
 * @remarks Endpoint `PATCH /api/staff-users/:userId`; backend quyết định `staff.update`, audit,
 * field error và conflict `STAFF_MODIFIED_SINCE_READ`. Caller phải refresh danh sách khi conflict.
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
 * Yêu cầu reset mật khẩu và parse credential tạm thời do backend phát hành.
 *
 * @param userId Định danh tài khoản cần reset.
 * @param reason Lý do audit do operator nhập; UI yêu cầu tối thiểu 10 ký tự.
 * @returns Envelope chứa user và `temporaryPassword` chỉ dành cho dialog bàn giao một lần.
 * @remarks Endpoint `POST /api/staff-users/:userId/password-resets`; backend quyết định
 * `staff.password.reset`, bắt buộc đổi mật khẩu và audit. Lỗi permission, validation hoặc network
 * được ném lên caller; adapter không lưu credential.
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
