'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useCurrentPrincipal } from './use-current-principal';

/** Redirects to /login when the session cookie is missing/expired instead of showing a raw fetch error. */
export function useRequireAuth() {
  const router = useRouter();
  const query = useCurrentPrincipal();

  useEffect(() => {
    if (query.isError) router.replace('/login');
  }, [query.isError, router]);

  return query;
}
