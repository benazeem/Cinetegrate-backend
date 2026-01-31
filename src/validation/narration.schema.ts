import { z } from 'zod';

// Constants
const MAX_NARRATION_LENGTH = 20000;

// Narration segment schema
export const narrationSegmentSchema = z
  .object({
    startTime: z.number().min(0, 'Start time must be non-negative'),
    endTime: z.number().min(0, 'End time must be non-negative'),
    duration: z.number().min(0, 'Duration must be non-negative'),
    character: z.string().min(1, 'Character is required').max(100, 'Character name is too long'),
    targetWordCount: z.number().int().min(0, 'Target word count must be non-negative'),
    minWords: z.number().int().min(0, 'Min words must be non-negative'),
    maxWords: z.number().int().min(0, 'Max words must be non-negative'),
    narration: z
      .string()
      .min(1, 'Narration text is required')
      .max(MAX_NARRATION_LENGTH, `Narration text is too long (max ${MAX_NARRATION_LENGTH} characters)`),
  })
  .strict()
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be greater than start time',
  })
  .refine((data) => data.maxWords >= data.minWords, {
    message: 'Max words must be greater than or equal to min words',
  });

export const regenerateNarrationSchema = z
  .object({
    extraPrompt: z.string().max(500, 'Extra prompt is too long'),
  })
  .strict();

export const uploadNarrationJSONSchema = z
  .object({
    narrationSegments: z
      .array(narrationSegmentSchema)
      .min(1, 'At least one narration segment is required')
      .max(100, 'Too many narration segments (max 100)'),
    totalDuration: z.number().min(0.1, 'Total duration must be greater than 0').optional(),
  })
  .strict();

export const updateNarrationSegmentsSchema = z
  .object({
    narrationSegments: z
      .array(narrationSegmentSchema)
      .min(1, 'At least one narration segment is required')
      .max(100, 'Too many narration segments (max 100)'),
  })
  .strict();

export const narrationIdParamSchema = z
  .object({
    narrationId: z.string().length(24, 'Invalid narration ID'),
  })
  .strict();

export const storyIdParamSchema = z
  .object({
    storyId: z.string().length(24, 'Invalid story ID'),
  })
  .strict();

export const storyNarrationParamSchema = z
  .object({
    storyId: z.string().length(24, 'Invalid story ID'),
    narrationId: z.string().length(24, 'Invalid narration ID'),
  })
  .strict();

export type NarrationSegmentInput = z.infer<typeof narrationSegmentSchema>;
export type RegenerateNarrationInput = z.infer<typeof regenerateNarrationSchema>;
export type UploadNarrationJSONInput = z.infer<typeof uploadNarrationJSONSchema>;
export type UpdateNarrationSegmentsInput = z.infer<typeof updateNarrationSegmentsSchema>;
export type NarrationIdParam = z.infer<typeof narrationIdParamSchema>;
export type StoryIdParam = z.infer<typeof storyIdParamSchema>;
export type StoryNarrationParam = z.infer<typeof storyNarrationParamSchema>;
