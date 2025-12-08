import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserModel, type User } from "@models/User.js";
import { generateResetToken } from "@utils/tokens.js";
import transporter from "@utils/mail.js";
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@validation/auth.schema.js";
import { getIpInfo } from "@utils/getIpInfo.js";
import { parseUserAgent } from "@utils/parseUserAgent.js";

type LoginDataType = LoginInput & {
  userAgent: string;
  ip: string | string[] | undefined;
};

const RESET_EXP_MIN = Number(process.env.PASSWORD_RESET_EXPIRES_MIN || 60);

export async function registerUser(input: RegisterInput): Promise<User> {
  const { email, password, displayName, username } = input;

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
    const usernameExists = await UserModel.findOne({ newUsername });
    if (usernameExists) {
      generateusername();
    }
    return newUsername;
  };

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await UserModel.create({
    email,
    passwordHash,
    username: username ? username.toLowerCase() : `${await generateusername()}`,
    displayName: displayName ?? email.split("@")[0],
  });

  return user;
}

export async function loginUser(input: LoginDataType): Promise<User> {
  const { email, password, userAgent, ip } = input;

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error("Email or Password does not match!");
  }

  const passedTest = await bcrypt.compare(password, user.passwordHash);
  if (!passedTest) {
    throw new Error("Email or Password does not match!");
  }

  const ipData: any = await getIpInfo(ip as string);
  const sessionId = crypto.randomBytes(32).toString("hex");
  const userAgentInfo = parseUserAgent(userAgent);

  user.sessions.push({
    sessionId,
    device: userAgentInfo.device,
    browser: userAgentInfo.browser,
    os: userAgentInfo.os,
    ipInfo: {
      ip: ipData.ip,
      city: ipData.cityName,
      country: ipData.countryName,
      timezone: ipData.timeZones[1],
      lat: ipData.latitude,
      lng: ipData.longitude,
      isp: ipData.asnOrganisation,
    },
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  });

  await user.save();

  console.log(ipData, sessionId, userAgentInfo);

  // user.sessions.push({
  //   sessionId,

  // })

  return user;
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
  const hashedPassword = await bcrypt.hash(newPassword, 10); // cost 12 suggested
  user.passwordHash = hashedPassword;

  user.passwordReset = undefined;

  await user.save();

  // Optionally email the user notifying password change
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Your password was changed",
    text: `Your password was changed. If you did not do this, please contact support immediately.`,
  });

  return;
}
