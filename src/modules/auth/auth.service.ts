import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose, { ObjectIdSchemaDefinition } from "mongoose";
import { UserModel, type User } from "@models/User.js";
import { SessionModel, type Session } from "@models/Session.js";
import {
  generateAccessToken,
  generateCsrfToken,
  generateRefreshToken,
  generateVerificationToken,
  hashToken,
  verifyToken,
} from "@utils/tokens.js";
import transporter from "config/mail.js";
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@validation/auth.schema.js";
import { getIpInfo } from "@utils/getIpInfo.js";
import { parseUserAgent } from "@utils/parseUserAgent.js";
import { resetPasswordTemplate } from "./emails/templates/resetPassword.js";
import { createUsername } from "@utils/createUsername.js";
import { newAccountTemplate } from "./emails/templates/newAccount.js";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "@middleware/error/index.js";
import { emailVerificationTemplate } from "./emails/templates/emailVerification.js";
import { passwordChangedNotificationTemplate } from "./emails/passwordChangedNotification.js";

type LoginInputWithMeta = LoginInput & {
  userAgent: string;
  ip: string | string[] | undefined;
};

type LoginOutput = {
  user: User;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
};

type RegisterInputWithMeta = RegisterInput & {
  userAgent: string;
  ip: string | string[] | undefined;
};

interface RegisterOutput {
  user: User;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

const RESET_EXP_MIN = Number(process.env.PASSWORD_RESET_EXPIRES_MIN || 10);

export async function registerUser(
  input: RegisterInputWithMeta
): Promise<RegisterOutput> {
  const { email, password, displayName, username, userAgent, ip } = input;
  // Check if email exists
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new ConflictError("Email already registered");
  }
  const usernameExist = await UserModel.findOne({ username });
  if (usernameExist) {
    throw new ConflictError("Username already exists");
  }
  // Metadata
  const ipData: any = await getIpInfo(ip as string);
  const userAgentInfo = parseUserAgent(userAgent);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    email,
    passwordHash,
    username: username
      ? username.toLowerCase()
      : `${await createUsername(email)}`,
    displayName: displayName ?? email.split("@")[0],
  });

  const sessionId: string = crypto.randomBytes(32).toString("hex");
  await SessionModel.create({
    sessionId,
    userId: user._id,
    userAgent,
    device: userAgentInfo.device,
    browser: userAgentInfo.browser,
    os: userAgentInfo.os,

    ip: ipData.ip,
    city: ipData.cityName,
    country: ipData.countryName,
    timezone: ipData.timeZones[1],
    lat: ipData.latitude,
    lng: ipData.longitude,
    isp: ipData.asnOrganisation,

    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  });

  const accessToken = generateAccessToken(user._id, sessionId);
  const refreshToken = generateRefreshToken(user._id, sessionId);
  const csrfToken = generateCsrfToken();
  const { subject, text, html } = newAccountTemplate(
    user.displayName || user.username || user.email.split("@")[0]
  );
  try {
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text,
      html,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new InternalServerError(
      "Failed to send new account email",
      errorMessage
    );
  }
  return { user, accessToken, refreshToken, csrfToken };
}

export async function loginUser(
  input: LoginInputWithMeta
): Promise<LoginOutput> {
  const { email, password, userAgent, ip } = input;

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new UnauthenticatedError("Email or Password does not match!");
  }

  const passedTest = await bcrypt.compare(password, user.passwordHash);
  if (!passedTest) {
    throw new UnauthenticatedError("Email or Password does not match!");
  }

  const ipData: any = await getIpInfo(ip as string);
  const userAgentInfo = parseUserAgent(userAgent);
  const sessionId: string = crypto.randomBytes(32).toString("hex");

  const session = await SessionModel.create({
    sessionId,
    userId: user._id,
    userAgent,
    device: userAgentInfo.device,
    browser: userAgentInfo.browser,
    os: userAgentInfo.os,

    ip: ipData.ip,
    city: ipData.cityName,
    country: ipData.countryName,
    timezone: ipData.timeZones[1],
    lat: ipData.latitude,
    lng: ipData.longitude,
    isp: ipData.asnOrganisation,

    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  });
  const accessToken = generateAccessToken(user._id, sessionId);
  const refreshToken = generateRefreshToken(user._id, sessionId);
  const csrfToken = generateCsrfToken();

  return { user, accessToken, refreshToken, csrfToken };
}

export async function createPasswordResetRequest(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalized });

  if (!user) {
    return;
  }

  const { raw, hash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + RESET_EXP_MIN * 60 * 1000);

  user.passwordReset = { tokenHash: hash, expiresAt, requestedAt: new Date() };
  user.changeHistory.push({
    field: "password",
    by: user._id,
    reason: "User requested password reset",
    at: new Date(),
    via: "user",
  });
  await user.save();

  const resetUrl = `${
    process.env.APP_URL
  }/auth/reset-password?token=${encodeURIComponent(
    raw
  )}&email=${encodeURIComponent(user.email)}`;

  const { subject, text, html } = resetPasswordTemplate(
    user.displayName || user.username || user.email.split("@")[0],
    resetUrl,
    RESET_EXP_MIN
  );

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new InternalServerError(
      "Failed to send password reset email",
      errorMessage
    );
  }
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const hash = hashToken(rawToken);
  const user = await UserModel.findOne({
    "passwordReset.tokenHash": hash,
  }).select("+passwordReset +passwordHash");
  if (
    !user ||
    !user.passwordReset?.tokenHash ||
    !user.passwordReset.expiresAt
  ) {
    throw new ConflictError("Invalid or expired token"); // generic message OK
  }
  if (user.passwordReset.expiresAt.getTime() < Date.now()) {
    user.passwordReset = undefined;
    await user.save();
    throw new ConflictError("Invalid or expired token");
  }

  const isValid = verifyToken(rawToken, user.passwordReset.tokenHash);
  if (!isValid) {
    throw new ConflictError("Invalid or expired token");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    user.passwordHash = hashedPassword;
    user.passwordReset = undefined;
    user.lastPasswordChangeAt = new Date();
    user.changeHistory.push({
      field: "password",
      by: user._id,
      from: null,
      to: null,
      reason: "User reset the password via password reset",
      at: new Date(),
      via: "user",
    });
    await user.save({ session });
    await SessionModel.deleteMany({ userId: user._id }, { session });
  } catch (err) {
    await session.abortTransaction();
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new InternalServerError("Failed to reset password", errorMessage);
  } finally {
    session.endSession();
  }

  const { subject, text, html } = passwordChangedNotificationTemplate(
    user.displayName || user.username || null
  );
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new InternalServerError(
      "Failed to send password changed notification email",
      errorMessage
    );
  }
  return;
}

export async function refreshTokens(
  refreshToken: string
): Promise<RefreshTokenOutput> {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
      sessionId: string;
    };
  } catch (err) {
    throw new UnauthenticatedError("Authentication failed");
  }

  const user = await UserModel.findOne({
    _id: decoded.userId,
  });
  const session = await SessionModel.findOne({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
  });

  if (!decoded || !user || !session || session.revokedAt)
    throw new UnauthenticatedError("Authentication failed");

  // ✅ update lastUsedAt for this session
  session.lastUsedAt = new Date();
  await session.save();
  const accessToken = generateAccessToken(user._id, session.sessionId);
  const newRefreshToken = generateRefreshToken(user._id, session.sessionId);
  const csrfToken = generateCsrfToken();

  return { accessToken, refreshToken: newRefreshToken, csrfToken };
}

export async function emailVerification(
  userId: ObjectIdSchemaDefinition
): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.emailVerified) {
    throw new ConflictError("Email is already verified");
  }
  const token = generateVerificationToken();

  const verifyEmailUrl = `${
    process.env.APP_URL
  }/verify-email?token=${encodeURIComponent(token.raw)}`;

  const { subject, text, html } = emailVerificationTemplate(
    user.displayName ?? user.username ?? null,
    verifyEmailUrl
  );
  user.emailVerification = {
    tokenHash: token.hash,
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    requestedAt: new Date(),
  };
  user.changeHistory.push({
    field: "email",
    by: user._id,
    reason: "User requested email verification",
    at: new Date(),
    via: "user",
  });
  await user.save();
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (err) {
    throw new InternalServerError("Failed to send verification email");
  }
  return;
}

export async function verifyEmail(verificationToken: string): Promise<void> {
  const hash = hashToken(verificationToken);
  const user = await UserModel.findOne({
    "emailVerification.tokenHash": hash,
  }).select("+emailVerification");
  if (!user) {
    return;
  }

  if (
    !user.emailVerification ||
    !user.emailVerification.tokenHash ||
    !user.emailVerification.expiresAt ||
    user.emailVerification.expiresAt!.getTime() < Date.now()
  ) {
    user.emailVerification = undefined;
    await user.save();
    throw new ConflictError("Invalid or expired verification token");
  }
  const isValid = verifyToken(
    verificationToken,
    user.emailVerification.tokenHash
  );
  if (!isValid) {
    throw new ConflictError("Invalid or expired verification token");
  }
  user.emailVerified = true;
  user.emailVerification = undefined;
  user.changeHistory.push({
    field: "email",
    by: user._id,
    reason: "User verified their email",
    at: new Date(),
    via: "user",
  });
  await user.save();
  return;
}

export async function verifyUpdateEmail(
  verificationToken: string
): Promise<void> {
  const hash = hashToken(verificationToken);
  const user = await UserModel.findOne({
    "pendingEmailChange.tokenHash": hash,
  }).select("+pendingEmailChange +changeHistory");
  if (!user) {
    return;
  }
  if (
    !user.pendingEmailChange ||
    !user.pendingEmailChange.expiresAt ||
    user.pendingEmailChange.expiresAt!.getTime() < Date.now() ||
    !user.pendingEmailChange.tokenHash ||
    !user.pendingEmailChange.newEmail
  ) {
    user.pendingEmailChange = undefined;
    await user.save();
    throw new ConflictError("Invalid or expired verification token");
  }
  const isValid = verifyToken(
    verificationToken,
    user.pendingEmailChange.tokenHash
  );
  if (!isValid) {
    throw new ConflictError("Invalid or expired verification token");
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    user.changeHistory.push({
      field: "email",
      from: user.email,
      to: user.pendingEmailChange.newEmail,
      by: user._id,
      reason: "User verified email change",
      at: new Date(),
      via: "user",
    });
    user.email = user.pendingEmailChange.newEmail;
    user.emailVerified = true;
    user.pendingEmailChange = undefined;
    await user.save({ session });
    await SessionModel.deleteMany({ userId: user._id }, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new InternalServerError(
      "Failed to verify updated email",
      errorMessage
    );
  } finally {
    session.endSession();
  }

  return;
}

export async function logoutUser(refreshToken: string) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
      sessionId: string;
    };
  } catch (err) {
    throw new UnauthenticatedError("Authentication failed");
  }
  const session = await SessionModel.findOne({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
  });
  if (!session) {
    throw new NotFoundError("Session not found");
  }
  session.revokedAt = new Date();
  await session.save();

  return;
}
