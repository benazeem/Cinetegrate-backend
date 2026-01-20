// src/middleware/errorHandler.ts
import { NextFunction, Request, Response } from 'express';
import { AppError } from './appError.js';
import logger from '@utils/logger.js';

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // If it's a known error (instance of AppError)
  if (err instanceof AppError) {
    logger.error({
      message: err.message,
      details: err.details,
      stack: err.stack,
      actions: err.actions,
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
      },
    });

    return res.status(err.statusCode).json(err.serialize());
  }
  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
};

export default errorHandler;
