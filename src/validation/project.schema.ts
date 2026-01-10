import {   CameraMotion, EnvironmentType, GenreType, MoodType, NarrativeScope, StyleType } from "@models/ContextProfile.js";
import { z } from "zod";

export const createProjectSchema = z
  .object({
    title: z.string().min(5, "Title is required").max(255, "Title is too long"),
    description: z
      .string()
      .min(5, "Description is required")
      .max(500, "Description is too long"),
    status: z.enum(["active", "draft"]),
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
export const projectIdParamSchema = z
  .object({
    projectId: z.string().length(24, "Invalid project ID"),
  })
  .strict();


  const environmentSchema = z.object({
  type: z.nativeEnum(EnvironmentType),
  cameraMotion: z.nativeEnum(CameraMotion),
  description: z.string().max(300).optional(),
});
 
const newProjectContextSchema = z.object({
  mode: z.literal("new"),

  data: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(600).optional(),

    genre: z.nativeEnum(GenreType),
    mood: z.nativeEnum(MoodType),
    style: z.nativeEnum(StyleType),

    narrativeScope: z
      .nativeEnum(NarrativeScope)
      .optional(),

    environment: environmentSchema,

    worldRules: z.string().max(1000).optional(),
    narrativeConstraints: z.string().max(1000).optional(),

    characters: z
      .array(
        z.object({
          name: z.string().min(1),
          description: z.string().max(300).optional(),
        })
      )
      .max(20)
      .optional(),

    forbiddenElements: z
      .array(
        z.object({
          label: z.string().min(1),
          severity: z.enum(["hard", "soft"]).optional(),
        })
      )
      .optional(),
  }),
});
 
const useGlobalProjectContextSchema = z.object({
  mode: z.literal("use-global"),
  globalContextId: z.string().min(1),
});
 
export const createProjectContextProfileSchema =
  z.discriminatedUnion("mode", [
    newProjectContextSchema,
    useGlobalProjectContextSchema,
  ]);

export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type UpdateManyIdsInput = z.infer<typeof updateManyIdsSchema>;
export type CreateProjectContextInput = z.infer<
  typeof createProjectContextProfileSchema
>;
