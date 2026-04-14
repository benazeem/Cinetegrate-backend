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
    this.actions = actions;
    this.isOperational = true;
    this.details = details;

    if (process.env.NODE_ENV === 'development') {
      Error.captureStackTrace(this, this.constructor);
      this.stackTrace = this.stack;
    }

    if (process.env.NODE_ENV === 'production') {
      this.stack = undefined;
      this.details = undefined;
    }
  }

  /**
   * Serialises the error into the standard API envelope:
   * { message: string, data: { code, actions?, details?, stack? } }
   */
  serialize() {
    const errorPayload: Record<string, unknown> = {
      code: this.code,
    };

    if (this.actions) {
      errorPayload.actions = this.actions;
    }

    if (process.env.NODE_ENV === 'development') {
      errorPayload.details = this.details;
      errorPayload.stack = this.stackTrace;
    }

    return {
      message: this.message,
      data: errorPayload,
    };
  }
}
