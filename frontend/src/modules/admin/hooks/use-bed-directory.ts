import { useReducer } from 'react';

import { initialBeds } from '../constants/admin-mock.data';
import type { BedRecord } from '../types/admin.types';

type BedDirectoryAction =
  | { type: 'ADD'; payload: BedRecord }
  | { type: 'UPDATE'; payload: { id: string; changes: Partial<BedRecord> } }
  | { type: 'DELETE'; payload: { id: string } };

/** Reducer cập nhật danh sách giường bệnh trên state cục bộ (không gọi API) cho các thao tác demo. */
const bedDirectoryReducer = (state: BedRecord[], action: BedDirectoryAction): BedRecord[] => {
  if (action.type === 'ADD') return [action.payload, ...state];

  if (action.type === 'UPDATE') {
    return state.map((bed) => (bed.id === action.payload.id ? { ...bed, ...action.payload.changes } : bed));
  }

  return state.filter((bed) => bed.id !== action.payload.id);
};

/**
 * Quản lý danh sách giường bệnh demo (thêm/sửa/xóa) hoàn toàn trên state cục bộ.
 * @returns `bedList` hiện tại và `dispatchBedDirectory` để các màn hình gọi hành động CRUD.
 */
export const useBedDirectory = () => useReducer(bedDirectoryReducer, initialBeds);

export type { BedDirectoryAction };
