import type { Request, Response, NextFunction } from "express";

interface ErrorResponse {
  status: "error" | "fail";
  message: string;
  statusCode: number;
  // Include stack trace only in development/testing environments
  stack?: string;
}

/**
 * Global Error Handler Middleware
 * * This function catches all errors thrown in the application and sends a
 * consistent, informative response to the client.
 * * @param err The error object passed from the route or previous middleware.
 * @param req The Express Request object.
 * @param res The Express Response object.
 * @param next The Express NextFunction.
 */

class CustomError extends Error {
  // HTTP Status Code (e.g., 400, 401, 404)
  public statusCode: number;

  // Flag to differentiate operational errors from programming errors (e.g., bugs)
  public isOperational: boolean;

  /**
   * @param message - The human-readable error message (e.g., "Invalid email format").
   * @param statusCode - The corresponding HTTP status code.
   */
  constructor(message: string, statusCode: number = 500) {
    // 1. Call the parent (Error) constructor
    super(message);

    // 2. Assign custom properties
    this.statusCode = statusCode;

    // Mark as operational since it's an error we created and expected to handle
    this.isOperational = true;

    // 3. Capture the stack trace (required for V8/Node.js to ensure proper inheritance)
    // This ensures that when the error is thrown, the stack trace starts at the call site.
    Error.captureStackTrace(this, this.constructor);
  }
}

const globalErrorHandler = (
  err: any, // Use 'any' or a specific BaseError interface
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Determine the status code and operational status
  let statusCode = err.statusCode || 500;
  let status: "error" | "fail" = err.isOperational ? "fail" : "error";
  let message = err.message || "Something went wrong on the server.";

  // --- 2. Handle specific common errors (Error Handling Logic) ---

  // Example: Handling a custom/expected error
  if (err instanceof CustomError) {
    // Use the status code and message defined in the custom error
    statusCode = err.statusCode;
    message = err.message;
  }
  // Example: Handling a non-operational error (e.g., programming error)
  else if (statusCode === 500) {
    // Log the full error for debugging but send a generic message to the client
    console.error("CRITICAL ERROR:", err);
    message = "Internal Server Error.";
  }

  // --- 3. Prepare the standardized response body ---
  const errorResponse: ErrorResponse = {
    status: status,
    message: message,
    statusCode: statusCode,
  };

  // Include the stack trace only in non-production environments
  if (process.env.NODE_ENV !== "production") {
    errorResponse.stack = err.stack;
  }

  // --- 4. Send the final response ---
  res.status(statusCode).json(errorResponse);
};

export default globalErrorHandler;
