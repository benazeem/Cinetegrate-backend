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
} from './sceneAssets.service.js';
import type {
  BulkDeleteAssetsInput,
  BulkRestoreAssetsInput,
  SetActiveAssetInput,
} from '@validation/sceneAssets.schema.js';
import { paginationResponse } from '@utils/paginationResponse.js';

// All Op controllers
export const getAllAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const pagination = req?.pagination;
  const sorting = req?.sorting;

  const [assets, total] = await getAllAssetsForScene(userId, sceneId, pagination, sorting);

  const paginationRes = paginationResponse(pagination, total as number);

  res.status(200).json({
    message: 'Assets retrieved successfully',
    data: assets,
    pagination: paginationRes,
  });
};

export const getAllDeletedAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const pagination = req?.pagination;
  const sorting = req?.sorting;

  const [assets, total] = await getAllDeletedAssets(userId, sceneId, pagination, sorting);

  const paginationRes = paginationResponse(pagination, total as number);

  res.status(200).json({
    message: 'Deleted assets retrieved successfully',
    data: assets,
    pagination: paginationRes,
  });
};

export const restoreAllDeletedAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;

  const result = await restoreAllDeletedAssets(userId, sceneId);

  res.status(200).json({
    message: 'All deleted assets restored successfully',
    restoredCount: result.restoredCount,
  });
};

export const softDeleteAllAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;

  const result = await softDeleteAllAssetsForScene(userId, sceneId);

  res.status(200).json({
    message: 'All assets safe deleted successfully',
    deletedCount: result.deletedCount,
  });
};

export const permanentDeleteAllAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const result = await permanentDeleteAllAssetsForScene(userId, sceneId);
  res.status(200).json({
    message: 'All assets deleted successfully',
    deletedCount: result.deletedCount,
  });
};

export const getAssetCountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;

  const count = await getAssetCount(userId, sceneId);

  res.status(200).json({
    message: 'Asset count retrieved successfully',
    count,
  });
};

// Bulk Op controllers
export const softBulkDeleteAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetIds } = req.validatedBody as BulkDeleteAssetsInput;

  const result = await softBulkDeleteAssets(userId, sceneId, assetIds);

  res.status(200).json({
    message: 'Assets safe deleted successfully',
    deletedCount: result.deletedCount,
  });
};

export const permanentBulkDeleteAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetIds } = req.validatedBody as BulkDeleteAssetsInput;

  const result = await permanentBulkDeleteAssets(userId, sceneId, assetIds);

  res.status(200).json({
    message: 'Assets safe deleted successfully',
    deletedCount: result.deletedCount,
  });
};

export const bulkRestoreAssetsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetIds } = req.validatedBody as BulkRestoreAssetsInput;

  const result = await bulkRestoreAssets(userId, sceneId, assetIds);

  res.status(200).json({
    message: 'Assets restored successfully',
    data: result,
  });
};

// Single Op controllers
export const getAssetByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;

  const asset = await getAssetById(userId, assetId);

  res.status(200).json({
    message: 'Asset retrieved successfully',
    data: asset,
  });
};

export const getActiveAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;

  const asset = await getActiveAssetForScene(userId, sceneId);

  if (!asset) {
    return res.status(200).json({
      message: 'No active asset found for this scene',
      data: null,
    });
  }

  res.status(200).json({
    message: 'Active asset retrieved successfully',
    data: asset,
  });
};

export const generateVideoAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const response = await generateVideoAsset(userId, sceneId);
  res.status(201).json({
    message: 'Video asset generated successfully',
    data: {
      sceneId,
      filename: response.videoUrl,
    },
  });
};

export const generateImageAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
};

export const uploadVideoAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  const response = await uploadVideoAsset(userId, sceneId, file);

  res.status(201).json({
    message: 'Video asset uploaded successfully',
    data: {
      sceneId,
      filename: response.videoUrl,
    },
  });
};

export const uploadImageAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  const response = await uploadImageAsset(userId, sceneId, file);

  res.status(201).json({
    message: 'Image asset uploaded successfully',
    data: {
      sceneId,
      filename: file.originalname,
    },
  });
};

export const setActiveAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sceneId } = req.params;
  const { assetId } = req.validatedBody as SetActiveAssetInput;

  const asset = await setActiveAsset(userId, sceneId, assetId);

  res.status(200).json({
    message: 'Active asset set successfully',
    data: asset,
  });
};

export const softDeleteAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;

  const asset = await softDeleteAsset(userId, assetId);
  res.status(200).json({
    message: 'Asset safe deleted successfully',
    data: asset,
  });
};

export const permanentDeleteAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;
  const asset = await permanentDeleteAsset(userId, assetId);
  res.status(200).json({
    message: 'Asset deleted successfully',
    data: asset,
  });
};

export const forceDeleteActiveAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;

  await forceDeleteActiveAsset(userId, assetId);
  res.status(200).json({
    message: 'Asset deleted successfully',
    data: true,
  });
};

export const restoreAssetController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { assetId } = req.params;

  const asset = await restoreAsset(userId, assetId);

  res.status(200).json({
    message: 'Asset restored successfully',
    data: asset,
  });
};
