import { Request, Response } from 'express';
import {
  getAllAudioAssetsForNarration,
  getAllDeletedAudioAssets,
  getAudioAssetById,
  getAudioAssetCount,
  getActiveAudioAssetForNarration,
  generateAudioAsset,
  regenerateAudioAsset,
  uploadNarrationAudioAsset,
  setActiveAudioAsset,
  softDeleteAudioAsset,
  permanentDeleteAudioAsset,
  forceDeleteActiveAudioAsset,
  restoreAudioAsset,
  softDeleteAllAudioAssetsForNarration,
  permanentDeleteAllAudioAssetsForNarration,
  restoreAllDeletedAudioAssets,
  softBulkDeleteAudioAssets,
  permanentBulkDeleteAudioAssets,
  bulkRestoreAudioAssets,
} from './audio.service.js';
import type {
  GenerateAudioAssetInput,
  RegenerateAudioAssetInput,
  SetActiveAudioAssetInput,
  BulkDeleteAudioAssetsInput,
  BulkRestoreAudioAssetsInput,
} from '@validation/audio.schema.js';
import { paginationResponse } from '@utils/paginationResponse.js';
import { sendSuccess, sendPaginated } from '@shared/response.js';
import { BadRequestError } from '@middleware/error/index.js';

// ==================== ALL OPERATIONS ====================

export const getAllAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [audioAssets, total] = await getAllAudioAssetsForNarration(userId, narrationId, pagination, sorting);
  return sendPaginated(
    res,
    audioAssets as any[],
    paginationResponse(pagination, total as number),
    'Audio assets retrieved successfully'
  );
};

export const getAllDeletedAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [audioAssets, total] = await getAllDeletedAudioAssets(userId, narrationId, pagination, sorting);
  return sendPaginated(
    res,
    audioAssets as any[],
    paginationResponse(pagination, total as number),
    'Deleted audio assets retrieved successfully'
  );
};

export const restoreAllDeletedAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const result = await restoreAllDeletedAudioAssets(userId, narrationId);
  return sendSuccess(
    res,
    { restoredCount: result.restoredCount },
    'All deleted audio assets restored successfully'
  );
};

export const softDeleteAllAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const result = await softDeleteAllAudioAssetsForNarration(userId, narrationId);
  return sendSuccess(
    res,
    { deletedCount: result.deletedCount },
    'All audio assets soft deleted successfully'
  );
};

export const permanentDeleteAllAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const result = await permanentDeleteAllAudioAssetsForNarration(userId, narrationId);
  return sendSuccess(
    res,
    { deletedCount: result.deletedCount },
    'All audio assets permanently deleted successfully'
  );
};

export const getAudioAssetCountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const count = await getAudioAssetCount(userId, narrationId);
  return sendSuccess(res, { count }, 'Audio asset count retrieved successfully');
};

// ==================== BULK OPERATIONS ====================

export const softBulkDeleteAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const { audioAssetIds } = req.validatedBody as BulkDeleteAudioAssetsInput;
  const result = await softBulkDeleteAudioAssets(userId, narrationId, audioAssetIds);
  return sendSuccess(res, { deletedCount: result.deletedCount }, 'Audio assets soft deleted successfully');
};

export const permanentBulkDeleteAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const { audioAssetIds } = req.validatedBody as BulkDeleteAudioAssetsInput;
  const result = await permanentBulkDeleteAudioAssets(userId, narrationId, audioAssetIds);
  return sendSuccess(
    res,
    { deletedCount: result.deletedCount },
    'Audio assets permanently deleted successfully'
  );
};

export const bulkRestoreAudioAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const { audioAssetIds } = req.validatedBody as BulkRestoreAudioAssetsInput;
  const result = await bulkRestoreAudioAssets(userId, narrationId, audioAssetIds);
  return sendSuccess(res, result, 'Audio assets restored successfully');
};

// ==================== SINGLE OPERATIONS ====================

export const getAudioAssetByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { audioAssetId } = req.params;
  const audioAsset = await getAudioAssetById(userId, audioAssetId);
  return sendSuccess(res, audioAsset, 'Audio asset retrieved successfully');
};

export const getActiveAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const audioAsset = await getActiveAudioAssetForNarration(userId, narrationId);
  return sendSuccess(
    res,
    audioAsset ?? null,
    audioAsset
      ? 'Active audio asset retrieved successfully'
      : 'No active audio asset found for this narration'
  );
};

export const generateAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const { voiceId, prompt } = req.validatedBody as GenerateAudioAssetInput;
  const audioAsset = await generateAudioAsset(userId, narrationId, voiceId, prompt);
  return sendSuccess(res, audioAsset, 'Audio asset generated successfully', 201);
};

export const regenerateAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { audioAssetId } = req.params;
  const { voiceId, extraPrompt } = req.validatedBody as RegenerateAudioAssetInput;
  const audioAsset = await regenerateAudioAsset(userId, audioAssetId, voiceId, extraPrompt);
  return sendSuccess(res, audioAsset, 'Audio asset regenerated successfully', 201);
};

export const uploadAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;

  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }

  const audioAsset = await uploadNarrationAudioAsset(userId, narrationId, req.file.path);
  return sendSuccess(res, audioAsset, 'Audio asset uploaded successfully', 201);
};

export const setActiveAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const { audioAssetId } = req.validatedBody as SetActiveAudioAssetInput;
  const audioAsset = await setActiveAudioAsset(userId, narrationId, audioAssetId);
  return sendSuccess(res, audioAsset, 'Audio asset set as active successfully');
};

export const softDeleteAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { audioAssetId } = req.params;
  await softDeleteAudioAsset(userId, audioAssetId);
  return sendSuccess(res, null, 'Audio asset soft deleted successfully');
};

export const permanentDeleteAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { audioAssetId } = req.params;
  await permanentDeleteAudioAsset(userId, audioAssetId);
  return sendSuccess(res, null, 'Audio asset permanently deleted successfully');
};

export const forceDeleteActiveAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { audioAssetId } = req.params;
  await forceDeleteActiveAudioAsset(userId, audioAssetId);
  return sendSuccess(res, null, 'Active audio asset force deleted successfully');
};

export const restoreAudioAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId, audioAssetId } = req.params;
  const audioAsset = await restoreAudioAsset(userId, narrationId, audioAssetId);
  return sendSuccess(res, audioAsset, 'Audio asset restored successfully');
};
