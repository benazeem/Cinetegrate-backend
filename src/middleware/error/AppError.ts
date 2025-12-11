// src/errors/AppError.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // identifies known errors vs unknown crashes
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
