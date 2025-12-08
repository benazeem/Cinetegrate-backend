// requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "@models/User.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      sessionId: string;
    };

    // find user with this session
    const user = await UserModel.findOne({
      _id: decoded.userId,
      "sessions.sessionId": decoded.sessionId,
    });

    if (!user) {
      return res.status(401).json({ message: "Session not found or invalid" });
    }

    // ✅ update lastUsedAt for this session
    await UserModel.updateOne(
      { _id: decoded.userId, "sessions.sessionId": decoded.sessionId },
      {
        $set: {
          "sessions.$.lastUsedAt": new Date(),
        },
      }
    );

    // attach user + sessionId to request
    (req as any).user = user;
    (req as any).sessionId = decoded.sessionId;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
