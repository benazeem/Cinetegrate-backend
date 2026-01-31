import { NextFunction, Request, Response } from 'express';
import { AppError } from './appError.js';
import logger from '@utils/logger.js';

const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = res.locals.requestId;

  if (err instanceof AppError) {
    logger.error({
      requestId,
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      method: req.method,
      path: req.originalUrl,
      userId: (req as any).user?._id,
    });

    return res.status(err.statusCode).json(err.serialize());
  }

  logger.error({
    requestId,
    name: 'UnhandledError',
    message: 'Unhandled exception',
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.originalUrl,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
};

export default errorHandler;
