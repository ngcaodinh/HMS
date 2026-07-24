import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../api-client';
import type { Principal } from '../types/principal';

/** Loads the identity of the currently authenticated principal via the httpOnly session cookie. */
export function useCurrentPrincipal() {
  return useQuery<Principal>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiGet<Principal>('/auth/me'),
    retry: false,
  });
}
