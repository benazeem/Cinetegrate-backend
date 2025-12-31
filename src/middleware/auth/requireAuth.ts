// requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "@models/User.js";
import { SessionModel } from "@models/Session.js";
import { UnauthenticatedError } from "@middleware/error/index.js";

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
      };
    } catch (err) {
      throw new UnauthenticatedError("Authentication required");
    }

    // find user with this session
    const user = await UserModel.findOne({
      _id: decoded.userId,
    });

    if (!user) {
      throw new UnauthenticatedError("Authentication required");
    }

    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      userId: decoded.userId,
      valid: true,
    });

    if (!session || session.revokedAt) {
      throw new UnauthenticatedError("Authentication required");
    }

    // ✅ update lastUsedAt for this session
    const now = Date.now();
    const last = session.lastUsedAt?.getTime() ?? 0;
    // Update only if old enough (e.g., 5 minutes)
    if (now - last > 5 * 60 * 1000) {
      session.lastUsedAt = new Date();
      await session.save();
    }

    // attach user + sessionId to request
    req.user = user;
    req.sessionId = decoded.sessionId;
    return next();
  } catch (err) {
    next(err);
  }
};
