// src/errors/index.ts
import { AppError } from "./AppError.js";

// 400 – Bad Request
export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: any) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

// 401 – Unauthorized (missing/invalid auth)
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: any) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

// 403 – Forbidden (has auth but no permission)
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: any) {
    super(message, 403, "FORBIDDEN", details);
  }
}

// 404 – Not Found
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: any) {
    super(message, 404, "NOT_FOUND", details);
  }
}

// 405 – Method Not Allowed
export class MethodNotAllowedError extends AppError {
  constructor(message = "Method not allowed", details?: any) {
    super(message, 405, "METHOD_NOT_ALLOWED", details);
  }
}

// 409 – Conflict (duplicate email, name, state conflict)
export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: any) {
    super(message, 409, "CONFLICT", details);
  }
}

// 410 – Gone (resource was deleted)
export class GoneError extends AppError {
  constructor(message = "Resource is gone", details?: any) {
    super(message, 410, "GONE", details);
  }
}

// 422 – Unprocessable Entity (validation errors)
export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity", details?: any) {
    super(message, 422, "UNPROCESSABLE_ENTITY", details);
  }
}

// 429 – Too Many Requests (rate limits)
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: any) {
    super(message, 429, "TOO_MANY_REQUESTS", details);
  }
}

// 500 – Internal Server Error
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: any) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}

// 503 – Service Unavailable (DB down, queue down, payment API down)
export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details?: any) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
  }
}

// 504 – Gateway Timeout (video API timeout, external API slow)
export class GatewayTimeoutError extends AppError {
  constructor(message = "Gateway timeout", details?: any) {
    super(message, 504, "GATEWAY_TIMEOUT", details);
  }
}
