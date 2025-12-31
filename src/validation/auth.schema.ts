// src/validation/auth.schema.ts
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Password policy:
 * - min 8 chars
 * - at least one letter and one number (adjust as needed)
 */
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const registerSchema = z
  .object({
    email: z.email({ message: "Invalid email address" }),

    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(passwordRegex, {
        message: "Password must contain at least one letter and one number",
      }),

    confirmPassword: z.string(),

    // optional public username (for profile URLs). lowercase, alphanumeric + - _
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9\-_]+$/, {
        message:
          "Username may contain letters, numbers, dash and underscore only",
      }),

    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required")
      .max(80, "Display name is too long"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  })
  .strict();

const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
  })
  .strict();

const resetPasswordSchema = z
  .object({
    token: z.string().min(10), // whatever length you expect
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(passwordRegex, {
        message: "Password must contain at least one letter and one number",
      }),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  })
  .strict();

const verifyEmailSchema = z
  .object({
    verificationToken: z.string().min(10),
  })
  .strict();

const verifyUpdateEmailSchema = z
  .object({
    verificationToken: z.string().min(10),
    code: z.string().length(6, { message: "Code must be 6 characters long" }),
  })
  .strict();

type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type ForgetPasswordInput = z.infer<typeof forgotPasswordSchema>;
type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
type VerifyUpdateEmailInput = z.infer<typeof verifyUpdateEmailSchema>;

export type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ForgetPasswordInput,
  VerifyEmailInput,
  VerifyUpdateEmailInput,
};
export {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  verifyUpdateEmailSchema,
};
