import type { CookieOptions } from "express";
import type { Request, Response } from "express";
import {
  createPasswordResetRequest,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  resetPassword,
} from "./auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  ForgetPasswordInput,
} from "@validation/auth.schema.js";
import { log } from "console";

const CookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1 * 24 * 60 * 60 * 1000,
};

export const registerController = async (req: Request, res: Response) => {
  const body = (req as unknown as { validatedBody?: RegisterInput })
    .validatedBody!;

  const userAgent: string = req.headers["user-agent"] || "unknown";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress;

  const payload = { ...body, userAgent, ip };

  const result = await registerUser(payload);

  const { user, accessToken, refreshToken, csrfToken } = result;

  return res
    .status(200)
    .cookie("access-token", accessToken, {
      ...CookieOptions,
      maxAge: 30 * 60 * 1000,
    })
    .cookie("refresh-token", refreshToken, {
      ...CookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .cookie("csrf-token", csrfToken, {
      ...CookieOptions,
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatarUrl,
      },
    });
};

export const loginController = async (req: Request, res: Response) => {
  const body = (req as unknown as { validatedBody?: LoginInput })
    .validatedBody!;

  const userAgent: string = req.headers["user-agent"] || "unknown";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress;

  const payload = { ...body, userAgent, ip };

  const result = await loginUser(payload);
  const { user, accessToken, refreshToken, csrfToken } = result;

  return res
    .status(200)
    .cookie("access-token", accessToken, {
      ...CookieOptions,
      maxAge: 30 * 60 * 1000,
    })
    .cookie("refresh-token", refreshToken, {
      ...CookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .cookie("csrf-token", csrfToken, {
      ...CookieOptions,
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatarUrl,
      },
    });
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const payload = (req as unknown as { validatedBody?: ForgetPasswordInput })
    .validatedBody!;
  await createPasswordResetRequest(payload.email);
  return res.status(200).json({
    status: "success",
    message:
      "If an account with that email exists, a reset link has been sent.",
  });
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, password } = (req as any).validatedBody;
  const email = String(req.query.email ?? req.body.email ?? "").toLowerCase();
  if (!email) throw new Error("Email is required");
  await resetPassword(email, token, password);
  return res.status(200).json({
    status: "success",
    message: "Password updated. Please log in with your new password.",
  });
};

export const refreshTokenController = async (req: Request, res: Response) => {
  console.log("Refresh token route hit");
  const reqRefreshToken = req.cookies["refresh-token"];
  if (!reqRefreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  const result = await refreshTokens(reqRefreshToken);
  const { accessToken, refreshToken, csrfToken } = result;
  console.log("Refreshed tokens:", { accessToken, refreshToken, csrfToken });
  return res
    .status(200)
    .cookie("access-token", accessToken, {
      ...CookieOptions,
      maxAge: 30 * 60 * 1000,
    })
    .cookie("refresh-token", refreshToken, {
      ...CookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .cookie("csrf-token", csrfToken, {
      ...CookieOptions,
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({ message: "Tokens refreshed" });
};

export const logoutController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies["refresh-token"];

  await logoutUser(refreshToken);

  return res
    .clearCookie("access-token")
    .clearCookie("refresh-token")
    .clearCookie("csrf-token")
    .status(200)
    .json({ message: "Logged out successfully" });
};
