import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { ObjectIdSchemaDefinition } from "mongoose";

const ACCESS_TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = process.env
  .ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"];
const ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_EXPIRES_IN: SignOptions["expiresIn"] = process.env
  .REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"];
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET!;

export function generateResetToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}
export function generateAccessToken(userId: ObjectIdSchemaDefinition, sessionId: string) {
  return jwt.sign({ userId, sessionId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}
export function generateRefreshToken(userId: ObjectIdSchemaDefinition, sessionId: string) {
  return jwt.sign({ userId, sessionId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function generateCsrfToken() {
  const token = crypto.randomBytes(24).toString("hex");
  const signed = crypto
    .createHmac("sha256", process.env.CSRF_SECRET!)
    .update(token)
    .digest("hex");
  return `${token}.${signed}`;
}
