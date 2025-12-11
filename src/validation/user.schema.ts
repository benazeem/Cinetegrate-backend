import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const updateProfileSchema = z.object({
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

const updateAvatarSchema = z.object({
  avatar: z.any().refine(
    (file) => {
      return file && file.mimetype && file.mimetype.startsWith("image/");
    },
    {
      message: "Only image files are allowed",
    }
  ),
});

type UpdateAvatarType = z.infer<typeof updateAvatarSchema>;
type UpdateProfileType = z.infer<typeof updateProfileSchema>;

export type { UpdateAvatarType, UpdateProfileType };

export { updateProfileSchema, updateAvatarSchema };

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
