// Compatibility path cho consumer cũ; implementation canonical nằm tại `app-error`.
export { AppError, isAppError, mapErrorDetailsToFields } from './app-error';
export type { ErrorDetail, FieldErrors } from './app-error';
