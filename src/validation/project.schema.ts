import { z } from "zod";

export const createProjectSchema = z
  .object({
    title: z.string().min(5, "Title is required").max(255, "Title is too long"),
    description: z
      .string()
      .min(5, "Description is required")
      .max(500, "Description is too long"),
    status: z.enum(["active", "draft", "archive", "delete"]),
    visibility: z.enum(["public", "private"]).optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title is required")
      .max(255, "Title is too long")
      .optional(),
    description: z.string().max(500, "Description is too long").optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );
export const updateProjectVisibilitySchema = z
  .object({
    visibility: z.enum(["public", "private"]),
  })
  .strict();
export const updateProjectStatusSchema = z
  .object({
    status: z.enum(["active", "draft", "archive"]),
  })
  .strict();
export const projectIdParamSchema = z
  .object({
    projectId: z.string().length(24, "Invalid project ID"),
  })
  .strict();

export const updateManyIdsSchema = z
  .object({
    projectIds: z
      .array(z.string().length(24, "Invalid project ID"))
      .min(1, "At least one project ID is required"),
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProjectVisibilityInput = z.infer<
  typeof updateProjectVisibilitySchema
>;
export type UpdateProjectStatusInput = z.infer<
  typeof updateProjectStatusSchema
>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type UpdateManyIdsInput = z.infer<typeof updateManyIdsSchema>;
