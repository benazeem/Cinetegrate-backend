import { z } from 'zod';
import {
  MAX_SCENE_TITLE_LENGTH,
  MAX_SCENE_DESCRIPTION_LENGTH,
  MAX_SCENE_PROMPT_LENGTH,
  MIN_SCENE_DURATION,
  MAX_SCENE_DURATION,
  MAX_SCENES_PER_STORY,
  MAX_EXTRA_PROMPT_LENGTH,
  sceneAuthorType,
} from '@constants/sceneConsts.js';

// PARAM SCHEMAS

export const sceneIdParamSchema = z
  .object({
    sceneId: z.string().length(24, 'Invalid scene ID'),
  })
  .strict();

export const storyIdParamSchema = z
  .object({
    storyId: z.string().length(24, 'Invalid story ID'),
  })
  .strict();

export const sceneAndStoryParamSchema = z
  .object({
    storyId: z.string().length(24, 'Invalid story ID'),
    sceneId: z.string().length(24, 'Invalid scene ID'),
  })
  .strict();

export const createSceneSchema = z
  .object({
    title: z
      .string()
      .max(MAX_SCENE_TITLE_LENGTH, `Title cannot exceed ${MAX_SCENE_TITLE_LENGTH} characters`)
      .trim()
      .optional(),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(MAX_SCENE_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_SCENE_DESCRIPTION_LENGTH} characters`)
      .trim(),
    imagePrompt: z
      .string()
      .min(1, 'Image prompt is required')
      .max(MAX_SCENE_PROMPT_LENGTH, `Image prompt cannot exceed ${MAX_SCENE_PROMPT_LENGTH} characters`)
      .trim(),
    videoPrompt: z
      .string()
      .max(MAX_SCENE_PROMPT_LENGTH, `Video prompt cannot exceed ${MAX_SCENE_PROMPT_LENGTH} characters`)
      .trim()
      .optional(),
    duration: z
      .number()
      .min(MIN_SCENE_DURATION, `Duration must be at least ${MIN_SCENE_DURATION} second`)
      .max(MAX_SCENE_DURATION, `Duration cannot exceed ${MAX_SCENE_DURATION} seconds`)
      .optional(),
    position: z.number().int('Position must be an integer').min(0, 'Position cannot be negative').optional(),
  })
  .strict();

export const generateAllScenesSchema = z
  .object({
    total: z
      .number()
      .int('Number of scenes must be an integer')
      .min(1, 'At least one scene must be generated')
      .max(MAX_SCENES_PER_STORY, `Cannot generate more than ${MAX_SCENES_PER_STORY} scenes`),
  })
  .strict();

export const updateSceneSchema = z
  .object({
    title: z
      .string()
      .max(MAX_SCENE_TITLE_LENGTH, `Title cannot exceed ${MAX_SCENE_TITLE_LENGTH} characters`)
      .trim()
      .optional(),
    description: z
      .string()
      .min(1, 'Description cannot be empty')
      .max(MAX_SCENE_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_SCENE_DESCRIPTION_LENGTH} characters`)
      .trim()
      .optional(),
    imagePrompt: z
      .string()
      .min(1, 'Image prompt cannot be empty')
      .max(MAX_SCENE_PROMPT_LENGTH, `Image prompt cannot exceed ${MAX_SCENE_PROMPT_LENGTH} characters`)
      .trim()
      .optional(),
    videoPrompt: z
      .string()
      .max(MAX_SCENE_PROMPT_LENGTH, `Video prompt cannot exceed ${MAX_SCENE_PROMPT_LENGTH} characters`)
      .trim()
      .optional()
      .nullable(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const durationSchema = z
  .object({
    duration: z
      .number()
      .min(MIN_SCENE_DURATION, `Duration must be at least ${MIN_SCENE_DURATION} second`)
      .max(MAX_SCENE_DURATION, `Duration cannot exceed ${MAX_SCENE_DURATION} seconds`),
  })
  .strict();

export const moveSceneSchema = z
  .object({
    direction: z.enum(['prev', 'next'], 'Direction must be either "prev" or "next"'),
  })
  .strict();

export const bulkReorderSchema = z
  .object({
    sceneIds: z
      .array(z.string().length(24, 'Invalid scene ID'))
      .min(1, 'At least one scene ID required')
      .max(MAX_SCENES_PER_STORY, `Cannot exceed ${MAX_SCENES_PER_STORY} scenes`),
  })
  .strict()
  .refine(
    (data) => {
      const uniqueIds = new Set(data.sceneIds);
      return uniqueIds.size === data.sceneIds.length;
    },
    { message: 'Duplicate scene IDs are not allowed' }
  );

export const bulkRestoreSchema = z
  .object({
    sceneIds: z
      .array(z.string().length(24, 'Invalid scene ID'))
      .min(1, 'At least one scene ID required')
      .max(MAX_SCENES_PER_STORY, `Cannot exceed ${MAX_SCENES_PER_STORY} scenes`),
  })
  .strict()
  .refine(
    (data) => {
      const uniqueIds = new Set(data.sceneIds);
      return uniqueIds.size === data.sceneIds.length;
    },
    { message: 'Duplicate scene IDs are not allowed' }
  );

// ============================================================================
// ASSET HANDLING SCHEMAS
// ============================================================================

export const setActiveAssetSchema = z
  .object({
    assetId: z.string().length(24, 'Invalid asset ID'),
  })
  .strict();

// ============================================================================
// AI GENERATION SCHEMAS
// ============================================================================

export const generateSceneSchema = z
  .object({
    position: z.number().int('Position must be an integer').min(0, 'Position cannot be negative').optional(),
  })
  .strict()
  .optional();

export const regenerateSceneSchema = z
  .object({
    extraPrompt: z
      .string()
      .max(MAX_EXTRA_PROMPT_LENGTH, `Extra prompt cannot exceed ${MAX_EXTRA_PROMPT_LENGTH} characters`)
      .trim()
      .optional(),
  })
  .strict()
  .optional();

// ============================================================================
// QUERY SCHEMAS (for optional query parameters)
// ============================================================================

export const getScenesQuerySchema = z
  .object({
    includeDeleted: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  })
  .strict()
  .optional();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SceneIdParam = z.infer<typeof sceneIdParamSchema>;
export type StoryIdParam = z.infer<typeof storyIdParamSchema>;
export type SceneAndStoryParam = z.infer<typeof sceneAndStoryParamSchema>;

export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type GenerateAllScenesInput = z.infer<typeof generateAllScenesSchema>;
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;
export type DurationInput = z.infer<typeof durationSchema>;

export type MoveSceneInput = z.infer<typeof moveSceneSchema>;
export type BulkReorderInput = z.infer<typeof bulkReorderSchema>;
export type BulkRestoreInput = z.infer<typeof bulkRestoreSchema>;

export type SetActiveAssetInput = z.infer<typeof setActiveAssetSchema>;

export type GenerateSceneInput = z.infer<typeof generateSceneSchema>;
export type RegenerateSceneInput = z.infer<typeof regenerateSceneSchema>;

export type GetScenesQuery = z.infer<typeof getScenesQuerySchema>;
