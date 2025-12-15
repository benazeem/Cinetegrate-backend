// src/errors/index.ts
import { AppError } from "./appError.js";
import { ERROR_CODES } from "./errorCodes.js";

// 400 – Bad Request
export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: any) {
    super(message, 400, ERROR_CODES.BAD_REQUEST, details);
  }
}

// 401 – Unauthenticated (invalid or missing credentials)
export class UnauthenticatedError extends AppError {
  constructor(message = "Invalid credentials", details?: any) {
    super(message, 401, ERROR_CODES.UNAUTHENTICATED, details);
  }
}

// 403 – User authenticated, but not allowed
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: any) {
    super(message, 403, ERROR_CODES.UNAUTHORIZED, details);
  }
}

// Explicit permission failure
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: any) {
    super(message, 403, ERROR_CODES.FORBIDDEN, details);
  }
}

// 404 – Resource not found
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: any) {
    super(message, 404, ERROR_CODES.NOT_FOUND, details);
  }
}

// 405 – Method not allowed
export class MethodNotAllowedError extends AppError {
  constructor(message = "Method not allowed", details?: any) {
    super(message, 405, ERROR_CODES.METHOD_NOT_ALLOWED, details);
  }
}

// 409 – Conflict (duplicate email, invalid state change, etc.)
export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: any) {
    super(message, 409, ERROR_CODES.CONFLICT, details);
  }
}

// 410 – Resource permanently gone
export class GoneError extends AppError {
  constructor(message = "Resource gone", details?: any) {
    super(message, 410, ERROR_CODES.GONE, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Payload too large", details?: any) {
    super(message, 413, ERROR_CODES.PAYLOAD_TOO_LARGE, details);
  }
}

// 422 – Validation errors
export class UnprocessableEntityError extends AppError {
  constructor(message = "Validation error", details?: any) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

// 429 – Rate limit exceeded
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: any) {
    super(message, 429, ERROR_CODES.TOO_MANY_REQUESTS, details);
  }
}

// 500 – Unexpected backend failure
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: any) {
    super(message, 500, ERROR_CODES.INTERNAL_ERROR, details);
  }
}

// 503 – External service or DB unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: any) {
    super(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE, details);
  }
}

// 504 – External API timeout
export class GatewayTimeoutError extends AppError {
  constructor(message = "Gateway timeout", details?: any) {
    super(message, 504, ERROR_CODES.GATEWAY_TIMEOUT, details);
  }
}
