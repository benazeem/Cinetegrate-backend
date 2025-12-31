import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

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
