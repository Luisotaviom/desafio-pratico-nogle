export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CPF_DUPLICADO' | 'INTERNAL_ERROR' | 'CEP_INDISPONIVEL';

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CPF_DUPLICADO: 409,
  INTERNAL_ERROR: 500,
  CEP_INDISPONIVEL: 502,
};

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.status = STATUS[code];
  }
}
