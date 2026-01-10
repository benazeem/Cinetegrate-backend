export class AppError extends Error {
  statusCode: number;
  code: string;
  actions?: {
    reason: string;
    nextStep: string;
  };
  isOperational: boolean;
  details?: any;
  stackTrace?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    actions?: {
      reason: string;
      nextStep: string;
    },
    details?: any
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.actions = actions; // optional now
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
    const base: any = {
      error: this.code,
      message: this.message,
    };

    // Only include actions if they exist
    if (this.actions) {
      base.actions = this.actions;
    }

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
