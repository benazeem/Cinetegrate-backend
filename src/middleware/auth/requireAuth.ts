// requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "@models/User.js";
import { SessionModel } from "@models/Session.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies["access-token"];

    console.log(req.cookies);

    if (!accessToken) {
      return res.status(401).json({ message: "No access token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        userId: string;
        sessionId: string;
      };
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // find user with this session
    const user = await UserModel.findOne({
      _id: decoded.userId,
    });

    if (!user) {
      return res.status(401).json({ message: "User not found or invalid" });
    }

    const session = await SessionModel.findOne({
      sessionId: decoded.sessionId,
      userId: decoded.userId,
    });

    if (!session || session.revokedAt) {
      return res.status(401).json({ message: "Session revoked or not found" });
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
    next();
  } catch (err) {
    new Error("Authentication middleware error");
  }
};
