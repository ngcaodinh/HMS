/**
 * Quy tắc username phía client phải đồng bộ với `identitySchemas.ts` để chặn request sai sớm.
 * Đây chỉ là kiểm tra UX; backend vẫn là nơi xác thực cuối cùng và không được tin client.
 */
export const usernameFormatPattern = /^[A-Za-z0-9._]+$/;
export const usernameMinLength = 3;
export const usernameMaxLength = 50;

