import { z } from "zod";
import {
  GenreType,
  MoodType,
  StyleType,
  EnvironmentType,
  CameraMotion,
  NarrativeScope,
} from "@models/ContextProfile.js";

export const createContextProfileSchema = z.object({
  projectId: z.string().optional(),

  name: z.string().min(1).max(100),
  description: z.string().max(600).optional(),

  genre: z.nativeEnum(GenreType),
  mood: z.nativeEnum(MoodType),
  style: z.nativeEnum(StyleType),
  narrativeScope: z.nativeEnum(NarrativeScope).optional(),

  environment: z.object({
    type: z.nativeEnum(EnvironmentType),
    cameraMotion: z.nativeEnum(CameraMotion),
    description: z.string().max(300).optional(),
  }),

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

  // 🔒 Explicit intent only
  makeGlobal: z.boolean().optional(),
  setAsProjectDefault: z.boolean().optional(),
});

export type CreateContextProfileInput = z.infer<typeof createContextProfileSchema>;