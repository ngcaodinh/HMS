import { useReducer } from 'react';

import { initialStaffMembers } from '../constants/admin-mock.data';
import type { StaffMember } from '../types/admin.types';

type StaffDirectoryAction =
  | { type: 'ADD'; payload: StaffMember }
  | { type: 'UPDATE'; payload: { id: string; changes: Partial<StaffMember> } }
  | { type: 'DELETE'; payload: { id: string } }
  | { type: 'TOGGLE_STATUS'; payload: { id: string } };

/**
 * Reducer cập nhật danh sách nhân viên trên state cục bộ (không gọi API) cho các thao tác demo.
 */
const staffDirectoryReducer = (state: StaffMember[], action: StaffDirectoryAction): StaffMember[] => {
  if (action.type === 'ADD') return [action.payload, ...state];

  if (action.type === 'UPDATE') {
    return state.map((staff) =>
      staff.id === action.payload.id ? { ...staff, ...action.payload.changes } : staff,
    );
  }

  if (action.type === 'DELETE') {
    return state.filter((staff) => staff.id !== action.payload.id);
  }

  return state.map((staff) =>
    staff.id === action.payload.id
      ? { ...staff, status: staff.status === 'active' ? 'locked' : 'active' }
      : staff,
  );
};

/**
 * Quản lý danh sách nhân viên demo (thêm/sửa/xóa/khóa-mở khóa) hoàn toàn trên state cục bộ.
 * @returns `staffList` hiện tại và `dispatchStaffDirectory` để các màn hình gọi hành động CRUD.
 */
export const useStaffDirectory = () =>
  useReducer(staffDirectoryReducer, initialStaffMembers);

export type { StaffDirectoryAction };
