/** Phần principal tối thiểu middleware cần để quyết định đổi mật khẩu và role routing. */
export type MiddlewarePrincipal = {
  mustChangePassword?: boolean;
  roleCodes?: unknown;
};

/** Kết quả fail-closed của bước đọc principal trong Next.js middleware. */
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

// Chỉ kiểm tra payload là object; các field chi tiết sẽ được middleware xử lý theo fallback
// an toàn.
const isMiddlewarePrincipal = (value: unknown): value is MiddlewarePrincipal =>
  typeof value === 'object' && value !== null;

/**
 * Đọc principal cho middleware qua `GET /auth/me` và phân loại kết quả để route guard xử lý.
 * @param backendBaseUrl Base URL API v1 ở server-side.
 * @param fetcher Hàm fetch tùy chọn, mặc định là fetch toàn cục; có thể thay bằng hàm kiểm thử.
 * @returns `authenticated` khi `data` là object; `unauthenticated` cho 401; `forbidden` cho
 * response khác 2xx hoặc JSON sai shape; `unavailable` khi không kết nối được backend.
 * @remarks Request dùng `no-store` và không retry. Middleware dùng kết quả này để redirect hoặc
 * trả 403/503; UI visibility không thay thế authorization ở backend.
 */
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
