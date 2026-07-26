export type MiddlewarePrincipal = {
  mustChangePassword?: boolean;
  roleCodes?: unknown;
};

export type MiddlewarePrincipalResult =
  | { status: 'authenticated'; principal: MiddlewarePrincipal }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' }
  | { status: 'unavailable' };

type Fetcher = typeof fetch;

type FetchMiddlewarePrincipalParams = {
  backendBaseUrl: string;
  fetcher?: Fetcher;
  token: string;
};

const isMiddlewarePrincipal = (value: unknown): value is MiddlewarePrincipal =>
  typeof value === 'object' && value !== null;

// Đọc principal cho middleware và chuyển lỗi mạng thành trạng thái fail-closed có thể xử lý.
export const fetchMiddlewarePrincipal = async ({
  backendBaseUrl,
  fetcher = fetch,
  token,
}: FetchMiddlewarePrincipalParams): Promise<MiddlewarePrincipalResult> => {
  let response: Response;

  try {
    response = await fetcher(`${backendBaseUrl}/auth/me`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return { status: 'unavailable' };
  }

  if (response.status === 401) return { status: 'unauthenticated' };
  if (!response.ok) return { status: 'forbidden' };

  try {
    const payload = await response.json();
    const principal = payload?.data;

    if (!isMiddlewarePrincipal(principal)) return { status: 'forbidden' };

    return { status: 'authenticated', principal };
  } catch {
    return { status: 'forbidden' };
  }
};
