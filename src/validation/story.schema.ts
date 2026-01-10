import { maxTimeLimit, minTimeLimit, storyIntent } from "@constants/storyConsts.js";
import { platform } from "node:process";
import {z} from "zod";


export const createStorySchema = z
.object({
    title: z.string().min(5, "Title is required").max(255, "Title is too long"),
    description: z
      .string()
      .min(5, "Description is required")
      .max(500, "Description is too long"), 
    timeLimit: z.number().min(minTimeLimit, "Time limit must be at least 10 seconds").max(maxTimeLimit, `Time limit cannot exceed ${maxTimeLimit} seconds`), 
    platform: z.enum([...platform]).optional(),
    intent: z.enum([...storyIntent]).optional(),
  })
  .strict();

export const writeContentSchema = z.object({
    content: z.string().min(20, "Content is too short").max(5000, "Content is too long"),
    summary: z.string().min(10, "Summary is too short").max(500, "Summary is too long"),
    keywords: z.array(z.string().max(30, "Keyword is too long")).max(10, "Too many keywords").optional(),
    tags: z.array(z.string().max(30, "Tag is too long")).max(10, "Too many tags").optional(),
}).strict();

  export const regenerateStorySchema = z
  .object({
    prompt: z.string().max(200, "Prompt is too long").optional(),
  })
  .strict();

  export const updateStorySchema = z
  .object({
    title: z.string().min(5, "Title is required").max(255, "Title is too long").optional(),
    description: z
      .string()
      .min(5, "Description is required")
      .max(1000, "Description is too long")
      .optional(), 
    timeLimit: z.number().min(minTimeLimit, "Time limit must be at least 10 seconds").max(maxTimeLimit, `Time limit cannot exceed ${maxTimeLimit} seconds`).optional(), 
    platform: z.enum([...platform]).optional(),
    intent: z.enum([...storyIntent]).optional(),
  })
  .strict();

export const storyIdParamSchema = z
.object({
    storyId: z.string().length(24, "Invalid story ID"),
})
.strict(); 

export const setStoryContextSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("use-project"),
  }).strict(),

  z.object({
    mode: z.literal("use-global"),
    globalContextId: z.string().min(1),
  }).strict(),
]);

export const addStoryContextSchema = z.object({ 
    data: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(600).optional(),

      genre: z.string(),
      mood: z.string(),
      style: z.string(),

      environment: z.object({
        type: z.string(),
        cameraMotion: z.string(),
        description: z.string().max(300).optional(),
      }),

      worldRules: z.string().max(1000).optional(),
      narrativeConstraints: z.string().max(1000).optional(),
    }),
  }).strict();

export type StoryIdParam = z.infer<typeof storyIdParamSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type RegenerateStoryInput = z.infer<typeof regenerateStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type WriteContentInput = z.infer<typeof writeContentSchema>;
export type SetStoryContextInput = z.infer<typeof setStoryContextSchema>;