import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { Types } from "mongoose";
import { UnauthenticatedError } from "@middleware/error/index.js";
import { AccountStatus } from "@constants/userConsts.js";

const ACCESS_TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = process.env
  .ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"];
const ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = process.env
  .REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"];
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET!;

export function generateVerificationToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function verifyToken(rawToken: string, tokenHash: string) {
  const providedHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const tokenHashBuffer = Buffer.from(tokenHash, "hex");
  const providedHashBuffer = Buffer.from(providedHash, "hex");

  // prevent timing attacks
  if (
    tokenHashBuffer.length !== providedHashBuffer.length ||
    !crypto.timingSafeEqual(tokenHashBuffer, providedHashBuffer)
  ) {
    throw new UnauthenticatedError("Invalid or expired token");
  }

  return true;
}

export function compareHashTokens(hash1: string, hash2: string): boolean {
  const hash1Buffer = Buffer.from(hash1, "hex");
  const hash2Buffer = Buffer.from(hash2, "hex");
  if (
    hash1Buffer.length !== hash2Buffer.length ||
    !crypto.timingSafeEqual(hash1Buffer, hash2Buffer)
  ) {
    return false;
  }
  return true;
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}
export function generateAccessToken(userId: Types.ObjectId, sessionId: string, role: string, accountStatus?: AccountStatus) {
  return jwt.sign({ userId, sessionId, role, accountStatus }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}
export function generateRefreshToken(
  userId: Types.ObjectId,
  sessionId: string,
  reduceTime: boolean = false
) {
  return jwt.sign({ userId, sessionId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function generateCsrfToken() {
  const token = crypto.randomBytes(24).toString("hex"); 
  return token;
}
