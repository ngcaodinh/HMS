import type { RoleCode } from '../auth/role-routing';

/**
 * Principal tối thiểu frontend nhận từ `GET /auth/me` qua BFF.
 * @remarks `roleCodes` phục vụ route/UI guard và hiển thị; authorization API vẫn do backend
 * quyết định. `isActive` là trạng thái tại thời điểm response và có thể thay đổi khi cache cũ.
 */
export interface Principal {
  userId: string;
  username: string;
  fullName: string;
  roleCodes: RoleCode[];
  departmentId: string;
  isActive: boolean;
}
