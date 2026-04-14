import { Request, Response } from 'express';
import {
  getAllAssetsForScene,
  getAllDeletedAssets,
  getAssetById,
  getAssetCount,
  getActiveAssetForScene,
  setActiveAsset,
  restoreAsset,
  bulkRestoreAssets,
  restoreAllDeletedAssets,
  uploadVideoAsset,
  uploadImageAsset,
  softDeleteAllAssetsForScene,
  permanentDeleteAllAssetsForScene,
  softBulkDeleteAssets,
  permanentBulkDeleteAssets,
  softDeleteAsset,
  permanentDeleteAsset,
  forceDeleteActiveAsset,
  generateVideoAsset,
  generateImageAsset,
} from './sceneAssets.service.js';
import type {
  BulkDeleteAssetsInput,
  BulkRestoreAssetsInput,
  SetActiveAssetInput,
} from '@validation/sceneAssets.schema.js';
import { paginationResponse } from '@utils/paginationResponse.js';
import { sendSuccess, sendPaginated } from '@shared/response.js';
import { BadRequestError } from '@middleware/error/index.js';

// ==================== ALL OPERATIONS ====================

export const getAllAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const pagination = req?.pagination;
  const sorting = req?.sorting;
  const [assets, total] = await getAllAssetsForScene(userId, sceneId, pagination, sorting);
  return sendPaginated(res, assets as any[], paginationResponse(pagination, total as number), 'Assets retrieved successfully');
};

export const getAllDeletedAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const pagination = req?.pagination;
  const sorting = req?.sorting;
  const [assets, total] = await getAllDeletedAssets(userId, sceneId, pagination, sorting);
  return sendPaginated(res, assets as any[], paginationResponse(pagination, total as number), 'Deleted assets retrieved successfully');
};

export const restoreAllDeletedAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const result = await restoreAllDeletedAssets(userId, sceneId);
  return sendSuccess(res, { restoredCount: result.restoredCount }, 'All deleted assets restored successfully');
};

export const softDeleteAllAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const result = await softDeleteAllAssetsForScene(userId, sceneId);
  return sendSuccess(res, { deletedCount: result.deletedCount }, 'All assets soft deleted successfully');
};

export const permanentDeleteAllAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const result = await permanentDeleteAllAssetsForScene(userId, sceneId);
  return sendSuccess(res, { deletedCount: result.deletedCount }, 'All assets permanently deleted successfully');
};

export const getAssetCountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const count = await getAssetCount(userId, sceneId);
  return sendSuccess(res, { count }, 'Asset count retrieved successfully');
};

// ==================== BULK OPERATIONS ====================

export const softBulkDeleteAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetIds } = req.validatedBody as BulkDeleteAssetsInput;
  const result = await softBulkDeleteAssets(userId, sceneId, assetIds);
  return sendSuccess(res, { deletedCount: result.deletedCount }, 'Assets soft deleted successfully');
};

export const permanentBulkDeleteAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetIds } = req.validatedBody as BulkDeleteAssetsInput;
  const result = await permanentBulkDeleteAssets(userId, sceneId, assetIds);
  return sendSuccess(res, { deletedCount: result.deletedCount }, 'Assets permanently deleted successfully');
};

export const bulkRestoreAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetIds } = req.validatedBody as BulkRestoreAssetsInput;
  const result = await bulkRestoreAssets(userId, sceneId, assetIds);
  return sendSuccess(res, result, 'Assets restored successfully');
};

// ==================== SINGLE OPERATIONS ====================

export const getAssetByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;
  const asset = await getAssetById(userId, assetId);
  return sendSuccess(res, asset, 'Asset retrieved successfully');
};

export const getActiveAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const asset = await getActiveAssetForScene(userId, sceneId);
  return sendSuccess(
    res,
    asset ?? null,
    asset ? 'Active asset retrieved successfully' : 'No active asset found for this scene',
  );
};

export const generateVideoAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const response = await generateVideoAsset(userId, sceneId);
  return sendSuccess(res, { sceneId, filename: response.url }, 'Video asset generated successfully', 201);
};

export const generateImageAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const response = await generateImageAsset(userId, sceneId);
  return sendSuccess(res, response, 'Image asset generation started successfully', 201);
};

export const uploadVideoAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const file = req.file;
  if (!file) {
    throw new BadRequestError('No video file uploaded');
  }
  const response = await uploadVideoAsset(userId, sceneId, file);
  return sendSuccess(res, response, 'Video asset uploaded successfully', 201);
};

export const uploadImageAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const file = req.file;
  if (!file) {
    throw new BadRequestError('No image file uploaded');
  }
  const response = await uploadImageAsset(userId, sceneId, file);
  return sendSuccess(res, response, 'Image asset uploaded successfully', 201);
};

export const setActiveAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetId } = req.validatedBody as SetActiveAssetInput;
  const asset = await setActiveAsset(userId, sceneId, assetId);
  return sendSuccess(res, asset, 'Active asset set successfully');
};

export const softDeleteAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;
  const asset = await softDeleteAsset(userId, assetId);
  return sendSuccess(res, asset, 'Asset soft deleted successfully');
};

export const permanentDeleteAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;
  const asset = await permanentDeleteAsset(userId, assetId);
  return sendSuccess(res, asset, 'Asset permanently deleted successfully');
};

export const forceDeleteActiveAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;
  await forceDeleteActiveAsset(userId, assetId);
  return sendSuccess(res, null, 'Asset force deleted successfully');
};

export const restoreAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;
  const asset = await restoreAsset(userId, assetId);
  return sendSuccess(res, asset, 'Asset restored successfully');
};
