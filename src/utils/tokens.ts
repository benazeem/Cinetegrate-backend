import crypto from "crypto";

export function generateResetToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
