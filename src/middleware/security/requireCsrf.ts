import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { BadRequestError } from "@middleware/error/index.js";
import { SessionModel } from "@models/Session.js";
import { AuthenticatedRequest } from "types/RequestTypes.js";
import { compareHashTokens, hashToken } from "@utils/tokens.js";

export const csrfMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const csrfCookie = req.cookies["csrf-token"];
  const csrfToken = req.headers["x-csrf-token"]; 
  if (!csrfToken || !csrfCookie) {
    throw new BadRequestError(
      "Invalid CSRF token"
    );
  }

  const session = await SessionModel.findOne({
    csrfTokenHash: hashToken(csrfCookie),
  }).select("+csrfTokenHash"); 
  
  if (!session) {
    throw new BadRequestError("Invalid CSRF token");
  }
  const hashCsrfToken = hashToken(csrfToken as string);
  const isValid = compareHashTokens(session.csrfTokenHash, hashCsrfToken);
  if (!isValid) {
    throw new BadRequestError("Invalid CSRF token");
  }

  next();
};
