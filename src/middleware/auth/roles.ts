import { Request, Response, NextFunction } from "express";

export const requireRole =
  (role: string) => (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    if (user.role !== role) return res.status(403).json({ error: "forbidden" });
    next();
  };

export const requireOwnerOrAdmin =
  (getResourceOwnerId: (req: Request) => string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    if (user.role === "admin") return next();
    const ownerId = getResourceOwnerId(req);
    if (ownerId !== String(user._id))
      return res.status(403).json({ error: "forbidden" });
    next();
  };
