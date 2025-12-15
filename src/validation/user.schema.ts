// src/validation/user.schema.ts
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ACCOUNT_STATUSES } from "constants/accountStatus.js";

/* -------------------------
   Body Schemas
   -------------------------*/

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().max(160).optional(),
  links: z
    .object({
      website: z.string().url().optional(),
      youtube: z.string().url().optional(),
      twitter: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      facebook: z.string().url().optional(),
      github: z.string().url().optional(),
    })
    .strict()
    .optional(),
});

export const updateAvatarSchema = z
  .object({
    // Expecting multer/whatever to attach file on req.body.avatar or req.file
    avatar: z
      .any()
      .refine(
        (file) =>
          file &&
          file.mimetype &&
          typeof file.mimetype === "string" &&
          file.mimetype.startsWith("image/"),
        {
          message: "Only image files are allowed",
        }
      ),
  })
  .strict();

export const updateNotificationsSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    newsletter: z.boolean().optional(),
    // extend as needed
  })
  .strict();

export const updatePrivacySettingsSchema = z
  .object({
    profileVisibility: z.enum(["public", "private", "unlisted"]).optional(),
    showEmailOnProfile: z.boolean().optional(),
    showLinksOnProfile: z.boolean().optional(),
    allowDiscoverability: z.boolean().optional(),
  })
  .strict();

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match",
  })
  .strict();

export const updateEmailSchema = z
  .object({
    newEmail: z.string().email(),
    confirmNewEmail: z.string().email(),
  })
  .refine((data) => data.newEmail === data.confirmNewEmail, {
    message: "New email and confirmation do not match",
  })
  .strict();

export const deleteAllSessionsSchema = z
  .object({
    removeCurrent: z.boolean().optional(),
  })
  .strict();

export const deleteSessionParamsSchema = z
  .object({
    sessionId: z.string().min(1),
  })
  .strict();

export const updateAccountSchema = z
  .object({
    accountStatus: z.enum(ACCOUNT_STATUSES),
  })
  .strict();
/* -------------------------
   Types
   -------------------------*/

export type UpdateAvatarType = z.infer<typeof updateAvatarSchema>;
export type UpdateProfileType = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationsType = z.infer<typeof updateNotificationsSchema>;
export type UpdatePrivacySettingsType = z.infer<
  typeof updatePrivacySettingsSchema
>;
export type UpdatePasswordType = z.infer<typeof updatePasswordSchema>;
export type UpdateEmailType = z.infer<typeof updateEmailSchema>;
export type DeleteAllSessionsType = z.infer<typeof deleteAllSessionsSchema>;
export type DeleteSessionParamsType = z.infer<typeof deleteSessionParamsSchema>;
export type UpdateAccountType = z.infer<typeof updateAccountSchema>;

/* -------------------------
   Middleware helpers
   -------------------------*/

// Attach validatedBody to req.validatedBody
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      (req as unknown as { validatedBody?: z.infer<T> }).validatedBody = parsed;
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        return res
          .status(400)
          .json({ error: "validation_error", details: errors });
      }
      return next(err);
    }
  };
}

// Validate route params (attach to req.validatedParams)
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.params);
      (req as unknown as { validatedParams?: z.infer<T> }).validatedParams =
        parsed;
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        return res
          .status(400)
          .json({ error: "validation_error", details: errors });
      }
      return next(err);
    }
  };
}
