import { z } from 'zod';
import {
  MAX_ASSET_PROMPT_LENGTH,
  MAX_ASSET_URL_LENGTH,
  assetTypes,
  visibilityTypes,
  generationSources,
  allFormats,
  MIN_DIMENSION,
  MAX_DIMENSION,
  MIN_ASSET_DURATION,
  MAX_ASSET_DURATION,
} from '@constants/sceneAssetConsts.js';

// PARAM SCHEMAS

export const sceneAssetIdParamSchema = z
  .object({
    assetId: z.string().length(24, 'Invalid asset ID'),
  })
  .strict();

export const sceneIdParamSchema = z
  .object({
    sceneId: z.string().length(24, 'Invalid scene ID'),
  })
  .strict();

export const sceneAssetAndSceneParamSchema = z
  .object({
    sceneId: z.string().length(24, 'Invalid scene ID'),
    assetId: z.string().length(24, 'Invalid asset ID'),
  })
  .strict();

// BODY SCHEMAS

export const createSceneAssetSchema = z
  .object({
    type: z.enum(assetTypes, { message: 'Asset type must be either "image" or "video"' }),
    url: z
      .string()
      .min(1, 'URL is required')
      .max(MAX_ASSET_URL_LENGTH, `URL cannot exceed ${MAX_ASSET_URL_LENGTH} characters`)
      .url('Invalid URL format'),
    visibility: z.enum(visibilityTypes, { message: 'Visibility must be either "private" or "public"' }).optional(),
    prompt: z
      .string()
      .max(MAX_ASSET_PROMPT_LENGTH, `Prompt cannot exceed ${MAX_ASSET_PROMPT_LENGTH} characters`)
      .trim()
      .optional(),
    generationSource: z
      .enum(generationSources, { message: 'Generation source must be either "ai" or "user"' })
      .optional(),
    format: z.enum(allFormats, { message: 'Invalid asset format' }).optional(),
    width: z
      .number()
      .int('Width must be an integer')
      .min(MIN_DIMENSION, `Width must be at least ${MIN_DIMENSION}`)
      .max(MAX_DIMENSION, `Width cannot exceed ${MAX_DIMENSION}`)
      .optional(),
    height: z
      .number()
      .int('Height must be an integer')
      .min(MIN_DIMENSION, `Height must be at least ${MIN_DIMENSION}`)
      .max(MAX_DIMENSION, `Height cannot exceed ${MAX_DIMENSION}`)
      .optional(),
    duration: z
      .number()
      .min(MIN_ASSET_DURATION, `Duration must be at least ${MIN_ASSET_DURATION} seconds`)
      .max(MAX_ASSET_DURATION, `Duration cannot exceed ${MAX_ASSET_DURATION} seconds`)
      .optional(),
  })
  .strict();

export const updateSceneAssetSchema = z
  .object({
    visibility: z.enum(visibilityTypes, { message: 'Visibility must be either "private" or "public"' }).optional(),
    prompt: z
      .string()
      .max(MAX_ASSET_PROMPT_LENGTH, `Prompt cannot exceed ${MAX_ASSET_PROMPT_LENGTH} characters`)
      .trim()
      .optional()
      .nullable(),
    width: z
      .number()
      .int('Width must be an integer')
      .min(MIN_DIMENSION, `Width must be at least ${MIN_DIMENSION}`)
      .max(MAX_DIMENSION, `Width cannot exceed ${MAX_DIMENSION}`)
      .optional(),
    height: z
      .number()
      .int('Height must be an integer')
      .min(MIN_DIMENSION, `Height must be at least ${MIN_DIMENSION}`)
      .max(MAX_DIMENSION, `Height cannot exceed ${MAX_DIMENSION}`)
      .optional(),
    duration: z
      .number()
      .min(MIN_ASSET_DURATION, `Duration must be at least ${MIN_ASSET_DURATION} seconds`)
      .max(MAX_ASSET_DURATION, `Duration cannot exceed ${MAX_ASSET_DURATION} seconds`)
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const bulkDeleteAssetsSchema = z
  .object({
    assetIds: z
      .array(z.string().length(24, 'Invalid asset ID'))
      .min(1, 'At least one asset ID is required')
      .max(50, 'Cannot delete more than 50 assets at once'),
  })
  .strict();

export const bulkRestoreAssetsSchema = z
  .object({
    assetIds: z
      .array(z.string().length(24, 'Invalid asset ID'))
      .min(1, 'At least one asset ID is required')
      .max(50, 'Cannot restore more than 50 assets at once'),
  })
  .strict();

export const setActiveAssetSchema = z
  .object({
    assetId: z.string().length(24, 'Invalid asset ID'),
  })
  .strict();

// Type exports
export type SceneAssetIdParam = z.infer<typeof sceneAssetIdParamSchema>;
export type SceneIdParam = z.infer<typeof sceneIdParamSchema>;
export type SceneAssetAndSceneParam = z.infer<typeof sceneAssetAndSceneParamSchema>;
export type CreateSceneAssetInput = z.infer<typeof createSceneAssetSchema>;
export type UpdateSceneAssetInput = z.infer<typeof updateSceneAssetSchema>;
export type BulkDeleteAssetsInput = z.infer<typeof bulkDeleteAssetsSchema>;
export type BulkRestoreAssetsInput = z.infer<typeof bulkRestoreAssetsSchema>;
export type SetActiveAssetInput = z.infer<typeof setActiveAssetSchema>;
