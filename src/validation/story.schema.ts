import { maxTimeLimit, minTimeLimit, platform, storyIntent } from '@constants/storyConsts.js';
import {
  CameraMotion,
  EnvironmentType,
  GenreType,
  MoodType,
  NarrativeScope,
  StyleType,
} from '@models/ContextProfile.js';
import { z } from 'zod';

export const createStorySchema = z
  .object({
    title: z.string().min(5, 'Title is required').max(255, 'Title is too long'),
    description: z.string().min(5, 'Description is required').max(500, 'Description is too long'),
    timeLimit: z
      .number()
      .min(minTimeLimit, 'Time limit must be at least 10 seconds')
      .max(maxTimeLimit, `Time limit cannot exceed ${maxTimeLimit} seconds`),
    platform: z.enum([...platform]).optional(),
    intent: z.enum([...storyIntent]).optional(),
    status: z.enum(['draft', 'active']),
  })
  .strict();

export const writeContentSchema = z
  .object({
    content: z.string().min(20, 'Content is too short').max(5000, 'Content is too long'),
    summary: z.string().min(10, 'Summary is too short').max(500, 'Summary is too long'),
    keywords: z.array(z.string().max(30, 'Keyword is too long')).max(10, 'Too many keywords').optional(),
    tags: z.array(z.string().max(30, 'Tag is too long')).max(10, 'Too many tags').optional(),
  })
  .strict();

export const regenerateStorySchema = z
  .object({
    prompt: z.string().max(200, 'Prompt is too long'),
  })
  .strict();

export const updateStorySchema = z
  .object({
    title: z.string().min(5, 'Title is required').max(255, 'Title is too long').optional(),
    description: z.string().min(5, 'Description is required').max(1000, 'Description is too long').optional(),
    timeLimit: z
      .number()
      .min(minTimeLimit, 'Time limit must be at least 10 seconds')
      .max(maxTimeLimit, `Time limit cannot exceed ${maxTimeLimit} seconds`)
      .optional(),
    platform: z.enum([...platform]).optional(),
    intent: z.enum([...storyIntent]).optional(),
  })
  .strict();

export const storyIdParamSchema = z
  .object({
    storyId: z.string().length(24, 'Invalid story ID'),
  })
  .strict();

export const setStoryContextSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('use-project'),
    })
    .strict(),

  z
    .object({
      mode: z.literal('use-global'),
      globalContextId: z.string().min(1),
    })
    .strict(),
]);

export const addStoryContextSchema = z
  .object({
    context: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(600).optional(),

      genre: z.enum(GenreType),
      mood: z.enum(MoodType),
      style: z.enum(StyleType),
      narrativeScope: z.enum(NarrativeScope).optional(),

      environment: z.object({
        type: z.enum(EnvironmentType),
        cameraMotion: z.enum(CameraMotion),
        description: z.string().max(300).optional(),
      }),

      worldRules: z.string().max(500).optional(),
      narrativeConstraints: z.string().max(500).optional(),

      characters: z
        .array(
          z.object({
            name: z.string().min(1).max(50),
            description: z.string().max(250).optional(),
          })
        )
        .max(10)
        .optional(),

      forbiddenElements: z
        .array(
          z.object({
            label: z.string().min(1).max(100),
            severity: z.enum(['hard', 'soft']),
          })
        )
        .max(50)
        .optional(),
    }),
  })
  .strict();

export type StoryIdParam = z.infer<typeof storyIdParamSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type RegenerateStoryInput = z.infer<typeof regenerateStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type WriteContentInput = z.infer<typeof writeContentSchema>;
export type SetStoryContextInput = z.infer<typeof setStoryContextSchema>;
export type AddStoryContextInput = z.infer<typeof addStoryContextSchema>;
