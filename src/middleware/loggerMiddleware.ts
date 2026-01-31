import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '@utils/logger.js';

const isDev = process.env.NODE_ENV !== 'production';

/* ---------- DEV helpers (safe: dev only) ---------- */

const getStatusColor = (status: number): string => {
  if (status >= 500) return '\x1b[31m'; // red
  if (status >= 400) return '\x1b[33m'; // yellow
  if (status >= 300) return '\x1b[36m'; // cyan
  return '\x1b[32m'; // green
};

/* ---------- Middleware ---------- */

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  if (isDev) {
    logger.debug(
      {
        requestId,
        method: req.method,
        path: req.originalUrl,
      },
      'Incoming request'
    );
  }

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    const logData = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?._id,
    };

    if (isDev) {
      const color = getStatusColor(res.statusCode);
      logger.info(
        logData,
        `${color}$ ${req.method} ${req.originalUrl} ${res.statusCode} ${logData.durationMs}ms\x1b[0m`
      );
      return;
    }

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed with client error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
}
