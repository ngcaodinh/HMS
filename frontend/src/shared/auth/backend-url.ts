/** Prefix cố định của backend API; biến môi trường chỉ cấu hình origin, không lặp prefix này. */
const API_V1_PREFIX = '/api/v1';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

// Chuẩn hóa cấu hình về origin thuần để các biến môi trường không phải chứa prefix API v1.
export const normalizeBackendOrigin = (value: string) => {
  const normalizedValue = trimTrailingSlash(value);

  return normalizedValue.endsWith(API_V1_PREFIX)
    ? normalizedValue.slice(0, -API_V1_PREFIX.length)
    : normalizedValue;
};

/** Origin backend theo thứ tự biến môi trường server-side, fallback localhost chỉ cho dev. */
export const backendOrigin = normalizeBackendOrigin(
  process.env.API_BASE_URL
    ?? process.env.NEXT_PUBLIC_API_BASE_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? 'http://localhost:4000',
);

/** Base URL hoàn chỉnh của backend API v1 sau khi áp dụng thứ tự ưu tiên cấu hình/fallback. */
export const backendApiV1BaseUrl = `${backendOrigin}${API_V1_PREFIX}`;

/** Ghép path tương đối vào backend API v1 và giữ đúng một dấu slash ở boundary. */
export const buildBackendApiV1Url = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${backendApiV1BaseUrl}${normalizedPath}`;
};
