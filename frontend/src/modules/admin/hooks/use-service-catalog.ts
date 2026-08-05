import { useReducer } from 'react';

import { initialServiceCatalog } from '../constants/admin-mock.data';
import type { ServiceCatalogItem } from '../types/admin.types';

type ServiceCatalogAction =
  | { type: 'ADD'; payload: ServiceCatalogItem }
  | { type: 'UPDATE'; payload: { id: string; changes: Partial<ServiceCatalogItem> } }
  | { type: 'DELETE'; payload: { id: string } }
  | { type: 'TOGGLE_INSURANCE'; payload: { id: string } };

/**
 * Reducer cập nhật danh mục dịch vụ trên state cục bộ (không gọi API) cho các thao tác demo.
 * Khi bật/tắt cờ BHYT qua toggle nhanh trong bảng, mức trần BHYT được xóa để tránh dữ liệu sai lệch.
 */
const serviceCatalogReducer = (
  state: ServiceCatalogItem[],
  action: ServiceCatalogAction,
): ServiceCatalogItem[] => {
  if (action.type === 'ADD') return [action.payload, ...state];

  if (action.type === 'UPDATE') {
    return state.map((item) =>
      item.id === action.payload.id ? { ...item, ...action.payload.changes } : item,
    );
  }

  if (action.type === 'DELETE') {
    return state.filter((item) => item.id !== action.payload.id);
  }

  return state.map((item) =>
    item.id === action.payload.id
      ? {
          ...item,
          coveredByHealthInsurance: !item.coveredByHealthInsurance,
          healthInsuranceCeilingPrice: item.coveredByHealthInsurance
            ? null
            : item.healthInsuranceCeilingPrice,
        }
      : item,
  );
};

/**
 * Quản lý danh mục dịch vụ demo (thêm/sửa/xóa/bật-tắt BHYT) hoàn toàn trên state cục bộ.
 * @returns `catalogList` hiện tại và `dispatchServiceCatalog` để các màn hình gọi hành động CRUD.
 */
export const useServiceCatalog = () =>
  useReducer(serviceCatalogReducer, initialServiceCatalog);

export type { ServiceCatalogAction };
