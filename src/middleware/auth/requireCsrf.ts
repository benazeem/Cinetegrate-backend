import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const requireCsrf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const csrfCookie = req.cookies["csrf-token"];
    const csrfToken = req.headers["x-csrf-token"];
    console.log("CSRF Cookie:", csrfCookie);
    if (!csrfToken || !csrfCookie) {
      const error = new Error("CSRF token missing") as any;
      error.statusCode = 403;
      error.status = "fail";
      return next(error);
    }

    // verify CSRF token
    const [csrfTokenValue, csrfTokenSignature] = csrfCookie.split(".");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.CSRF_SECRET!)
      .update(csrfTokenValue)
      .digest("hex");
      console.log("Signature:", expectedSignature,csrfTokenSignature);
      console.log("Token Value:", csrfTokenValue,csrfToken);
    if (
      expectedSignature !== csrfTokenSignature ||
      csrfTokenValue !== csrfToken
    ) {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
