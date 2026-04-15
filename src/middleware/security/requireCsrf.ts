import { ALLOWED_ORIGINS } from '@constants/globalConts.js';
import { UnauthorizedError } from '@middleware/error/index.js';
import { NextFunction, Request, Response } from 'express';

export const csrfMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin as string | undefined;

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    throw new UnauthorizedError('Invalid origin');
  }

  const csrfHeader = req.headers['x-csrf-token'];
  const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;

  if (!csrfToken) {
    throw new UnauthorizedError('Missing CSRF token');
  }

  const csrfCookie = req.cookies['csrf-token'];

  if (!csrfCookie || csrfCookie !== csrfToken) {
    throw new UnauthorizedError('Invalid CSRF token');
  }
  next();
};
