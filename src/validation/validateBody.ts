// src/validation/validateBody.ts
import { ZodSchema } from "zod";
import type { RequestHandler } from "express";

export const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(422).json({
        error: "validation_error",
        issues: result.error.flatten(),
      });
    }

    req.validatedBody = result.data;
    next();
  };
