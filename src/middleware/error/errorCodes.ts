// src/errors/errorCodes.ts
export const ERROR_CODES = {
  BAD_REQUEST: "bad_request",

  UNAUTHENTICATED: "unauthenticated",
  INVALID_CREDENTIALS: "invalid_credentials",

  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",

  NOT_FOUND: "not_found",
  METHOD_NOT_ALLOWED: "method_not_allowed",

  CONFLICT: "conflict",

  GONE: "gone",
  PAYLOAD_TOO_LARGE: "payload_too_large",

  UNPROCESSABLE_ENTITY: "unprocessable_entity",

  VALIDATION_ERROR: "validation_error",

  TOO_MANY_REQUESTS: "too_many_requests",

  INTERNAL_ERROR: "internal_error",
  SERVICE_UNAVAILABLE: "service_unavailable",
  GATEWAY_TIMEOUT: "gateway_timeout",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
