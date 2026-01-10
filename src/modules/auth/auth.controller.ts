import type { CookieOptions } from "express";
import type { Request, Response } from "express";
import {
  createPasswordResetRequest,
  sendEmailVerification,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  resetPassword,
  verifyEmail,
  verifyUpdateEmail,
} from "./auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  ForgetPasswordInput,
  VerifyEmailInput,
  VerifyUpdateEmailInput,
} from "@validation/auth.schema.js"; 

const CookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1 * 24 * 60 * 60 * 1000,
};

const CSRF_AGE = 15*24*60*1000;
const REFRESH_AGE = 15*24*60*1000;
const ACCESS_AGE = 30*60*1000;

export const registerController = async (req: Request, res: Response) => {
  const body =  req.validatedBody as RegisterInput;

  const userAgent: string = req.headers["user-agent"] || "unknown";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress;

  const payload = { ...body, userAgent, ip };

  const result = await registerUser(payload);

  const { user, tokens } = result;
  const { accessToken, refreshToken, csrfToken } = tokens;

  return res
    .status(200)
    .cookie("access-token", accessToken, {
      ...CookieOptions,
      maxAge: ACCESS_AGE,
    })
    .cookie("refresh-token", refreshToken, {
      ...CookieOptions,
      maxAge: REFRESH_AGE,
    })
    .cookie("csrf-token", csrfToken, {
      ...CookieOptions,
      httpOnly: false,
      maxAge: CSRF_AGE,
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
  const body = req.validatedBody as LoginInput;
  const userAgent: string = req.headers["user-agent"] || "unknown";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress;

  const payload = { ...body, userAgent, ip };

  const result = await loginUser(payload);
  const { user, tokens } = result;
  const { accessToken, refreshToken, csrfToken } = tokens;

  return res
    .status(200)
    .cookie("access-token", accessToken, {
      ...CookieOptions,
      maxAge: ACCESS_AGE,
    })
    .cookie("refresh-token", refreshToken, {
      ...CookieOptions,
      maxAge:  REFRESH_AGE,
    })
    .cookie("csrf-token", csrfToken, {
      ...CookieOptions,
      httpOnly: false,
      maxAge: CSRF_AGE,
    })
    .json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatarUrl,
        accountStatus: user.accountStatus,
      },
    });
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const payload = req.validatedBody as ForgetPasswordInput;
  await createPasswordResetRequest(payload.email);
  return res.status(200).json({
    status: "success",
    message:
      "If an account with that email exists, a reset link has been sent.",
  });
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, password } = req.validatedBody as { token: string; password: string };
  await resetPassword(token, password);
  return res.status(200).json({
    status: "success",
    message: "Password updated. Please log in with your new password.",
  });
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const reqRefreshToken = req.cookies["refresh-token"];
  const userAgent: string = req.headers["user-agent"] || "unknown";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress;
  if (!reqRefreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  const result = await refreshTokens(reqRefreshToken, userAgent, ip);
  const { accessToken, refreshToken, csrfToken } = result;
  return res
    .status(200)
    .cookie("access-token", accessToken, {
      ...CookieOptions,
      maxAge: ACCESS_AGE,
    })
    .cookie("refresh-token", refreshToken, {
      ...CookieOptions,
      maxAge: REFRESH_AGE,
    })
    .cookie("csrf-token", csrfToken, {
      ...CookieOptions,
      httpOnly: false,
      maxAge: CSRF_AGE,
    })
    .json({ message: "Tokens refreshed" });
};

export const emailVerificationController = async (
  req: Request,
  res: Response
) => {
  const userId = req?.user!.id

  await sendEmailVerification(userId);
  return res.status(200).json({
    message: "Verification email sent successfully",
  });
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const { verificationToken } = req.validatedBody as VerifyEmailInput;

  await verifyEmail(verificationToken);
  return res.status(200).json({
    message: "Email verified successfully",
  });
};

export const verifyEmailChangeController = async (
  req: Request,
  res: Response
) => {
  const { verificationToken, code } = req.validatedBody as VerifyUpdateEmailInput;
  const currentSessionId = req?.sessionId;
  await verifyUpdateEmail(verificationToken, code, currentSessionId);
  return res.status(200).json({
    message: "Email change verified successfully",
  });
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
