'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

/** Clears the httpOnly session cookie via the BFF route and returns to /login. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    queryClient.clear();
    router.push('/login');
  };
}
