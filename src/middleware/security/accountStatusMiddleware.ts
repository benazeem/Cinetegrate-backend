import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "types/RequestTypes.js";
import { ForbiddenError } from "@middleware/error/index.js";

export function requireActiveAccount(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const status = (req as unknown as AuthenticatedRequest).user.accountStatus;
  if (status !== "active") {
    throw new ForbiddenError(`Account is ${status}. Reactivation required.`);
  }
  next();
}

export function blockBannedAccounts(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const status = (req as unknown as AuthenticatedRequest).user.accountStatus;
  if (status === "banned") {
    throw new ForbiddenError("This account has been permanently banned.");
  }

  next();
}

export function allowOnlyInactiveAccounts(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const status = (req as unknown as AuthenticatedRequest).user.accountStatus;

  if (status === "active") {
    throw new ForbiddenError("Account is already active.");
  }
  next();
}
