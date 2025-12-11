import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserModel, type User } from "@models/User.js";
import { SessionModel, type Session } from "@models/Session.js";
import {
  generateAccessToken,
  generateCsrfToken,
  generateRefreshToken,
  generateResetToken,
} from "@utils/tokens.js";
import transporter from "@utils/mail.js";
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@validation/auth.schema.js";
import { getIpInfo } from "@utils/getIpInfo.js";
import { parseUserAgent } from "@utils/parseUserAgent.js";

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
    throw new Error("Email already registered");
  }
  const usernameExist = await UserModel.findOne({ username });
  if (usernameExist) {
    throw new Error("Username already exists");
  }

  const generateusername = async (): Promise<string> => {
    const newUsername = (
      email.split("@")[0] + crypto.randomBytes(2).toString(`hex`)
    ).toLowerCase();
    const usernameExists = await UserModel.findOne({ username: newUsername });
    if (usernameExists) {
      generateusername();
    }
    return newUsername;
  };

  // Metadata
  const ipData: any = await getIpInfo(ip as string);
  const userAgentInfo = parseUserAgent(userAgent);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await UserModel.create({
    email,
    passwordHash,
    username: username ? username.toLowerCase() : `${await generateusername()}`,
    displayName: displayName ?? email.split("@")[0],
  });

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

export async function loginUser(
  input: LoginInputWithMeta
): Promise<LoginOutput> {
  const { email, password, userAgent, ip } = input;

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new Error("Email or Password does not match!");
  }

  const passedTest = await bcrypt.compare(password, user.passwordHash);
  if (!passedTest) {
    throw new Error("Email or Password does not match!");
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

  if (!user) return;

  // generate token and hash
  const { raw, hash } = generateResetToken();

  // set expiry
  const expiresAt = new Date(Date.now() + RESET_EXP_MIN * 60 * 1000);

  user.passwordReset = { tokenHash: hash, expiresAt, requestedAt: new Date() };
  await user.save();

  // Build reset link - frontend route will accept token and show reset form
  const resetUrl = `${
    process.env.APP_URL
  }/auth/reset-password?token=${encodeURIComponent(
    raw
  )}&email=${encodeURIComponent(user.email)}`;

  // Send email (HTML + plain text)
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Reset your Cinetegrate password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in ${RESET_EXP_MIN} minutes.`,
    html: `
      <p>Hi ${user.displayName ?? ""},</p>
      <p>You requested a password reset. Click the link below to create a new password. This link expires in ${RESET_EXP_MIN} minutes.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
}

export async function resetPassword(
  email: string,
  rawToken: string,
  newPassword: string
) {
  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (
    !user ||
    !user.passwordReset?.tokenHash ||
    !user.passwordReset.expiresAt
  ) {
    throw new Error("Invalid or expired token"); // generic message OK
  }

  // check expiry
  if (user.passwordReset.expiresAt.getTime() < Date.now()) {
    user.passwordReset = undefined;
    await user.save();
    throw new Error("Invalid or expired token");
  }

  // hash provided token and compare (use constant time compare)
  const providedHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const tokenHashBuffer = Buffer.from(user.passwordReset.tokenHash, "hex");
  const providedHashBuffer = Buffer.from(providedHash, "hex");

  // prevent length issues
  if (
    tokenHashBuffer.length !== providedHashBuffer.length ||
    !crypto.timingSafeEqual(tokenHashBuffer, providedHashBuffer)
  ) {
    throw new Error("Invalid or expired token");
  }

  // Good — set new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.passwordHash = hashedPassword;
  user.passwordReset = undefined;
  await user.save();

  await SessionModel.deleteMany({ userId: user._id });

  // Optionally email the user notifying password change
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Your password was changed",
    text: `Your password was changed. If you did not do this, please contact support immediately.`,
  });

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
    throw new Error("Invalid refresh token");
  }

  const user = await UserModel.findOne({
    _id: decoded.userId,
  });
  const session = await SessionModel.findOne({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
  });

  if (!decoded || !user || !session || session.revokedAt)
    throw new Error("Invalid refresh token");

  // ✅ update lastUsedAt for this session
  session.lastUsedAt = new Date();
  await session.save();
  const accessToken = generateAccessToken(user._id, session.sessionId);
  const newRefreshToken = generateRefreshToken(user._id, session.sessionId);
  const csrfToken = generateCsrfToken();

  return { accessToken, refreshToken: newRefreshToken, csrfToken };
}

export async function logoutUser(refreshToken: string) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
      sessionId: string;
    };
  } catch (err) {
    throw new Error("Invalid refresh token");
  }
  const session = await SessionModel.findOne({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
  });
  if (session && !session.revokedAt) {
    session.revokedAt = new Date();
    await session.save();
  }
  return;
}
