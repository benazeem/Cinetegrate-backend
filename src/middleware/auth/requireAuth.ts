// requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";  
import { UnauthenticatedError } from "@middleware/error/index.js"; 
import { AccountStatus } from "@constants/userConts.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies["access-token"];

    if (!accessToken) {
      throw new UnauthenticatedError("Authentication required");
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        userId: string;
        sessionId: string;
        role:"user"|"admin";
        accountStatus?:AccountStatus;
      };
    } catch (err) {
      throw new UnauthenticatedError("Authentication required");
    }
  
    // attach user + sessionId to request
    req.user = { id: decoded.userId, role: decoded.role, accountStatus: decoded.accountStatus };
    req.sessionId = decoded.sessionId; 
    return next();
  } catch (err) {
    next(err);
  }
};
