export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly code: string;
  readonly fields?: FieldErrors;
  readonly status: number;

  constructor({
    code,
    fields,
    message,
    status,
  }: {
    code: string;
    fields?: FieldErrors;
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}
