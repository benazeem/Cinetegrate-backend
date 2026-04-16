import crypto from 'crypto';
import { ALLOWED_ORIGINS } from '@constants/globalConts.js';
import { UnauthorizedError } from '@middleware/error/index.js';
import { NextFunction, Request, Response } from 'express';
import { compareHashTokens } from '@utils/tokens.js';

export const csrfMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!unsafeMethods.includes(req.method)) return next();

  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    throw new UnauthorizedError('Missing Origin or Referer header');
  }

  const originUrl = new URL(origin as string).origin;
  if (!ALLOWED_ORIGINS.includes(originUrl)) {
    throw new UnauthorizedError('Invalid origin');
  }

  const csrfHeader = req.headers['x-csrf-token'];
  const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
  const csrfCookie = req.cookies['csrf-token'];

  if (!csrfToken || !csrfCookie) {
    throw new UnauthorizedError('CSRF credentials missing');
  }

  const tokenMatch = compareHashTokens(csrfToken, csrfCookie);

  if (!tokenMatch) {
    throw new UnauthorizedError('Invalid CSRF token');
  }

  next();
};
