import { UnauthenticatedError } from '@middleware/error/index.js';
import type { CookieOptions } from 'express';
import type { Request, Response } from 'express';
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
} from './auth.service.js';
import type {
  RegisterInput,
  LoginInput,
  ForgetPasswordInput,
  VerifyEmailInput,
  VerifyUpdateEmailInput,
} from '@validation/auth.schema.js';
import { sendSuccess } from '@shared/response.js';

// ─── Cookie Configuration ───────────────────────────────────────────────────

const CSRF_AGE = 15 * 24 * 60 * 60 * 1000; // 15 days
const REFRESH_AGE = 15 * 24 * 60 * 60 * 1000; // 15 days
const ACCESS_AGE = 30 * 60 * 1000; // 30 minutes

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  domain: process.env.NODE_ENV === 'production' ? process.env.PARENT_DOMAIN : undefined,
  maxAge: ACCESS_AGE,
};

/** Sets the three auth cookies (access / refresh / csrf) on the response. */
function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string }
) {
  res
    .cookie('access-token', tokens.accessToken, { ...cookieOptions, maxAge: ACCESS_AGE })
    .cookie('refresh-token', tokens.refreshToken, { ...cookieOptions, maxAge: REFRESH_AGE })
    .cookie('csrf-token', tokens.csrfToken, { ...cookieOptions, httpOnly: false, maxAge: CSRF_AGE });
}

// ─── Controllers ────────────────────────────────────────────────────────────

export const registerController = async (req: Request, res: Response) => {
  const body = req.validatedBody as RegisterInput;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.socket.remoteAddress;

  const { user, tokens } = await registerUser({ ...body, userAgent, ip });

  setAuthCookies(res, tokens);

  return res.status(201).json({
    message: 'Account created successfully',
    data: {
      user: {
        email: user.email,
        username: user.username,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
      },
    },
  });
};

export const loginController = async (req: Request, res: Response) => {
  const body = req.validatedBody as LoginInput;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;

  const { user, tokens } = await loginUser({ ...body, userAgent, ip });

  setAuthCookies(res, tokens);

  return res.status(200).json({
    message: 'Logged in successfully',
    data: {
      user: {
        email: user.email,
        username: user.username,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        accountStatus: user.accountStatus,
      },
    },
  });
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { email } = req.validatedBody as ForgetPasswordInput;
  await createPasswordResetRequest(email);
  return sendSuccess(res, null, 'If an account with that email exists, a reset link has been sent.');
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, password } = req.validatedBody as { token: string; password: string };
  await resetPassword(token, password);
  return sendSuccess(res, null, 'Password updated. Please log in with your new password.');
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const reqRefreshToken = req.cookies['refresh-token'];
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.socket.remoteAddress;

  if (!reqRefreshToken) {
    throw new UnauthenticatedError('No refresh token, authentication failed');
  }

  const tokens = await refreshTokens(reqRefreshToken, userAgent, ip);
  setAuthCookies(res, tokens);

  return sendSuccess(res, null, 'Tokens refreshed');
};

export const emailVerificationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await sendEmailVerification(userId);
  return sendSuccess(res, null, 'Verification email sent successfully');
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const { verificationToken } = req.validatedBody as VerifyEmailInput;
  await verifyEmail(verificationToken);
  return sendSuccess(res, null, 'Email verified successfully');
};

export const verifyEmailChangeController = async (req: Request, res: Response) => {
  const { verificationToken, code } = req.validatedBody as VerifyUpdateEmailInput;
  const currentSessionId = req.sessionId;
  await verifyUpdateEmail(verificationToken, code, currentSessionId);
  return sendSuccess(res, null, 'Email change verified successfully');
};

export const logoutController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies['refresh-token'];
  await logoutUser(refreshToken);

  return res
    .clearCookie('access-token')
    .clearCookie('refresh-token')
    .clearCookie('csrf-token')
    .status(200)
    .json({ message: 'Logged out successfully', data: null });
};
