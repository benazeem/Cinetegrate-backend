import crypto from 'crypto';
import { ALLOWED_ORIGINS } from '@constants/globalConts.js';
import { UnauthorizedError } from '@middleware/error/index.js';
import { NextFunction, Request, Response } from 'express';
import logger from '@utils/logger.js';

const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

const normalizeToken = (val: string): string => {
  try {
    return decodeURIComponent(val).replace(/^"|"$/g, '').trim();
  } catch {
    return val.replace(/^"|"$/g, '').trim();
  }
};

const safeCompare = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) return false;

  return crypto.timingSafeEqual(aBuf, bBuf);
};

export const csrfMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const rawOrigin = req.headers.origin || req.headers.referer;

  if (rawOrigin) {
    try {
      const originUrl = new URL(rawOrigin as string).origin;

      if (!ALLOWED_ORIGINS.includes(originUrl)) {
        return next(new UnauthorizedError('Invalid origin'));
      }
    } catch {
      return next(new UnauthorizedError('Invalid origin format'));
    }
  }

  const csrfHeaderRaw = req.headers['x-csrf-token'];
  const csrfHeader = Array.isArray(csrfHeaderRaw) ? csrfHeaderRaw[0] : csrfHeaderRaw;

  const csrfCookieRaw = req.cookies['csrf-token'];

  if (!csrfHeader || !csrfCookieRaw) {
    return next(new UnauthorizedError('CSRF credentials missing'));
  }

  const csrfToken = normalizeToken(csrfHeader);
  const csrfCookie = normalizeToken(csrfCookieRaw);

  const isValid = safeCompare(csrfToken, csrfCookie);

  if (!isValid) {
    logger.warn(`'CSRF DEBUG',
      header: ${csrfHeader},
      cookie: ${csrfCookieRaw},
      normalizedHeader: ${csrfToken},
      normalizedCookie: ${csrfCookie},
      headerLength: ${csrfToken.length},
      cookieLength: ${csrfCookie.length},
    `);

    return next(new UnauthorizedError('Invalid CSRF token'));
  }

  return next();
};
