import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@middleware/error/index.js";
import { SessionModel } from "@models/Session.js";
import { verifyToken } from "@utils/tokens.js";
import { ALLOWED_ORIGINS } from "constants/globalConts.js";

export const csrfMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  if (
    origin &&
    (origin === "null" || !ALLOWED_ORIGINS.includes(origin as string))
  ) {
    throw new UnauthorizedError("Invalid origin");
  }

  const csrfToken = req.headers["x-csrf-token"];
  if (!csrfToken) {
    throw new UnauthorizedError();
  }
  const csrfTokenValue = Array.isArray(csrfToken) ? csrfToken[0] : csrfToken;

  const session = await SessionModel.findOne({
    sessionId: req.sessionId,
    valid: true,
    revokedAt: null,
  }).select("+csrfTokenHash");

  if (!session) {
    throw new UnauthorizedError();
  }

  try {
    verifyToken(csrfTokenValue, session.csrfTokenHash);
  } catch {
    throw new UnauthorizedError();
  }

  next();
};
