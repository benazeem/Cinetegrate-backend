import jwt from 'jsonwebtoken';
import { ALLOWED_ORIGINS } from '@constants/globalConts.js';
import { UnauthorizedError } from '@middleware/error/index.js';
import { NextFunction, Request, Response } from 'express';

const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const csrfMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!unsafeMethods.includes(req.method)) return next();

  const rawOrigin = req.headers.origin || req.headers.referer;

  if (!rawOrigin) {
    return next(new UnauthorizedError('Missing origin'));
  }

  let origin: string;
  try {
    origin = new URL(rawOrigin as string).origin;
  } catch {
    return next(new UnauthorizedError('Invalid origin format'));
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return next(new UnauthorizedError('Invalid origin'));
  }

  const headerTokenRaw = req.headers['x-csrf-token'];
  const headerToken = Array.isArray(headerTokenRaw) ? headerTokenRaw[0] : headerTokenRaw;

  const cookieToken = req.cookies?.['csrf_token'];

  if (!headerToken || !cookieToken) {
    return next(new UnauthorizedError('Missing CSRF token'));
  }

  if (headerToken !== cookieToken) {
    return next(new UnauthorizedError('CSRF token mismatch'));
  }

  let decoded: any;
  try {
    decoded = jwt.verify(headerToken, process.env.CSRF_TOKEN_SECRET!);
  } catch {
    return next(new UnauthorizedError('Invalid CSRF token'));
  }

  if (!req.sessionId || decoded.sessionId !== req.sessionId) {
    return next(new UnauthorizedError('Invalid CSRF session'));
  }

  if (decoded.userId && req.user?.id && decoded.userId !== req.user.id) {
    return next(new UnauthorizedError('CSRF user mismatch'));
  }

  return next();
};
