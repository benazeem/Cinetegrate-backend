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
      })
      .optional(),

    displayName: z.string().trim().min(1).max(80).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

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
  });

type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type ForgetPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ForgetPasswordInput,
};
export {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
};

/**
 * Generic express middleware factory that validates req.body with a Zod schema.
 * On success attaches validated object to req.validatedBody
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // parseAsync to allow async refinements in future
      const parsed = await schema.parseAsync(req.body);
      // attach to request for typed access in controllers
      (req as unknown as { validatedBody?: z.infer<T> }).validatedBody = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // map Zod errors to a clean JSON shape
        const errors = err.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        return _res
          .status(400)
          .json({ error: "validation_error", details: errors });
      }
      next(err);
    }
  };
}
