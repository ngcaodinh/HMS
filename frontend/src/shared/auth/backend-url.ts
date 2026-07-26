const API_V1_PREFIX = '/api/v1';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

// Chuẩn hóa cấu hình backend về origin thuần để env không phải chứa prefix /api/v1.
export const normalizeBackendOrigin = (value: string) => {
  const normalizedValue = trimTrailingSlash(value);

  return normalizedValue.endsWith(API_V1_PREFIX)
    ? normalizedValue.slice(0, -API_V1_PREFIX.length)
    : normalizedValue;
};

export const backendOrigin = normalizeBackendOrigin(
  process.env.API_BASE_URL
    ?? process.env.NEXT_PUBLIC_API_BASE_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? 'http://localhost:4000',
);

export const backendApiV1BaseUrl = `${backendOrigin}${API_V1_PREFIX}`;

// Ghép path tương đối vào backend API v1 và giữ đúng một dấu slash ở boundary.
export const buildBackendApiV1Url = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${backendApiV1BaseUrl}${normalizedPath}`;
};
