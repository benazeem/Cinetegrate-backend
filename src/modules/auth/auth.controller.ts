import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import {
  createPasswordResetRequest,
  loginUser,
  registerUser,
  resetPassword,
} from "./auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  ForgetPasswordInput,
} from "@validation/auth.schema.js";

export const registerController = async (req: Request, res: Response) => {
  const payload = (req as unknown as { validatedBody?: RegisterInput })
    .validatedBody!;

  const result = await registerUser(payload);

  const user = {
    id: result._id,
    email: result.email,
    username: result.username,
    displayName: result.displayName,
    avatar: result.avatarUrl,
  };

  const jwt_data = jwt.sign(
    { user_id: user.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  return res.status(201).json({
    message: "User created",
    user,
    tokens: {
      accessToken: jwt_data,
      expiresIn: 3600,
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

  const user = {
    id: result._id,
    email: result.email,
    username: result.username,
    displayName: result.displayName,
    avatar: result.avatarUrl,
  };

  const jwt_data = jwt.sign(
    { user_id: user.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  return res
    .status(200)
    .json({ user, tokens: { accessToken: jwt_data, expiresIn: 3600 } });
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
