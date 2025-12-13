// src/errors/AppError.ts
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
  details?: any;
  stackTrace?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Dev mode: include stack trace
    if (process.env.NODE_ENV === "development") {
      Error.captureStackTrace(this, this.constructor);
      this.stackTrace = this.stack;
    }

    // Production mode: hide stack trace
    if (process.env.NODE_ENV === "production") {
      this.stack = undefined;
      this.details = undefined;
    }
  }

  serialize() {
    const base = {
      error: this.code,
      message: this.message,
    };

    if (process.env.NODE_ENV === "development") {
      return {
        ...base,
        details: this.details,
        stack: this.stackTrace,
      };
    }

    return base;
  }
}
