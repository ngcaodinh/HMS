'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useCurrentPrincipal } from './use-current-principal';

/**
 * Trả query principal và điều hướng về `/login` khi việc đọc phiên thất bại.
 * @returns Query state/data từ `useCurrentPrincipal`, gồm loading, error và principal hiện tại.
 * @remarks Hook không retry và không tự cấp quyền; middleware/BFF/backend vẫn là boundary quyết
 * định session và authorization. Mọi lỗi query hiện tại đều được xem là cần đăng nhập lại.
 */
export function useRequireAuth() {
  const router = useRouter();
  const query = useCurrentPrincipal();

  /** Đồng bộ trạng thái lỗi query với router; không có subscription ngoài và không cần cleanup. */
  useEffect(() => {
    if (query.isError) router.replace('/login');
  }, [query.isError, router]);

  return query;
}
