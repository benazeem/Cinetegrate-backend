import { Router } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { validateParams } from '@validation/validateParams.js';
import { validateBody } from '@validation/validateBody.js';

import {
  sceneIdParamSchema,
  sceneAssetIdParamSchema,
  sceneAssetAndSceneParamSchema,
  // bulkDeleteAssetsSchema,
  bulkRestoreAssetsSchema,
  setActiveAssetSchema,
  bulkDeleteAssetsSchema,
} from '@validation/sceneAssets.schema.js';

import {
  getAllAssetsController,
  getAllDeletedAssetsController,
  getAssetByIdController,
  getAssetCountController,
  getActiveAssetController,
  setActiveAssetController,
  uploadVideoAssetController,
  uploadImageAssetController,
  softDeleteAssetController,
  softBulkDeleteAssetsController,
  softDeleteAllAssetsController,
  permanentDeleteAssetController,
  permanentBulkDeleteAssetsController,
  permanentDeleteAllAssetsController,
  forceDeleteActiveAssetController,
  restoreAssetController,
  bulkRestoreAssetsController,
  restoreAllDeletedAssetsController,
  generateVideoAssetController,
  generateImageAssetController,
} from './sceneAssets.controller.js';
import multer from 'multer';
import { videoAssetUpload } from '@middleware/multer/videoAssetUpload.js';
import { imageAssetUpload } from '@middleware/multer/imageAssetUpload.js';
import { paginationAndSortingMiddleware } from '@middleware/paginationAndSorting.js';

const router = Router();

// All Op routes
router.get(
  '/:sceneId',
  validateParams(sceneIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getAllAssetsController)
);
router.get(
  '/:sceneId/deleted',
  validateParams(sceneIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getAllDeletedAssetsController)
);
router.get('/:sceneId/count', validateParams(sceneIdParamSchema), asyncHandler(getAssetCountController));

router.delete('/:sceneId/', validateParams(sceneIdParamSchema), asyncHandler(softDeleteAllAssetsController));

router.delete(
  '/:sceneId/permanent',
  validateParams(sceneIdParamSchema),
  asyncHandler(permanentDeleteAllAssetsController)
);

router.post(
  '/:sceneId/restore',
  validateParams(sceneIdParamSchema),
  asyncHandler(restoreAllDeletedAssetsController)
);

// Bulk Op routes
router.post(
  '/:sceneId/soft-bulk-delete',
  validateParams(sceneIdParamSchema),
  validateBody(bulkDeleteAssetsSchema),
  asyncHandler(softBulkDeleteAssetsController)
);

router.post(
  '/:sceneId/permanent-bulk-delete',
  validateParams(sceneIdParamSchema),
  validateBody(bulkDeleteAssetsSchema),
  asyncHandler(permanentDeleteAllAssetsController)
);

router.post(
  '/:sceneId/bulk-restore',
  validateParams(sceneIdParamSchema),
  validateBody(bulkRestoreAssetsSchema),
  asyncHandler(bulkRestoreAssetsController)
);

// Single Op routes
router.get('/:assetId', validateParams(sceneAssetIdParamSchema), asyncHandler(getAssetByIdController));

router.get('/:sceneId/active', validateParams(sceneIdParamSchema), asyncHandler(getActiveAssetController));

router.post(
  '/:sceneId/generate/video',
  validateParams(sceneIdParamSchema),
  asyncHandler(generateVideoAssetController)
);

router.post(
  '/:sceneId/generate/image',
  validateParams(sceneIdParamSchema),
  asyncHandler(generateImageAssetController)
);

router.post(
  '/:sceneId/upload-video',
  validateParams(sceneIdParamSchema),
  videoAssetUpload,
  asyncHandler(uploadVideoAssetController)
);

router.post(
  '/:sceneId/upload-image',
  validateParams(sceneIdParamSchema),
  imageAssetUpload,
  asyncHandler(uploadImageAssetController)
);

router.patch(
  '/:sceneId/:assetId/set-active',
  validateParams(sceneAssetAndSceneParamSchema),
  validateBody(setActiveAssetSchema),
  asyncHandler(setActiveAssetController)
);

router.delete('/:assetId', validateParams(sceneAssetIdParamSchema), asyncHandler(softDeleteAssetController));
router.delete(
  '/:assetId/permanent',
  validateParams(sceneAssetIdParamSchema),
  asyncHandler(permanentDeleteAssetController)
);
router.delete(
  '/:assetId/force',
  validateParams(sceneAssetIdParamSchema),
  asyncHandler(forceDeleteActiveAssetController)
);

router.patch(
  '/:sceneId/:assetId/restore',
  validateParams(sceneAssetAndSceneParamSchema),
  asyncHandler(restoreAssetController)
);

export default router;
