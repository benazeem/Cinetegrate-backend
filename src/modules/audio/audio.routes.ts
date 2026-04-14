import { Router } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { validateParams } from '@validation/validateParams.js';
import { validateBody } from '@validation/validateBody.js';
import { paginationAndSortingMiddleware } from '@middleware/request/paginationAndSorting.js';
import { audioAssetUpload } from '@middleware/multer/audioAssetUpload.js';

import {
  narrationIdParamSchema,
  audioAssetIdParamSchema,
  audioAssetAndNarrationParamSchema,
  generateAudioAssetSchema,
  regenerateAudioAssetSchema,
  uploadAudioAssetSchema,
  setActiveAudioAssetSchema,
  bulkDeleteAudioAssetsSchema,
  bulkRestoreAudioAssetsSchema,
} from '@validation/audio.schema.js';

import {
  getAllAudioAssetsController,
  getAllDeletedAudioAssetsController,
  getAudioAssetByIdController,
  getAudioAssetCountController,
  getActiveAudioAssetController,
  generateAudioAssetController,
  regenerateAudioAssetController,
  uploadAudioAssetController,
  setActiveAudioAssetController,
  softDeleteAudioAssetController,
  permanentDeleteAudioAssetController,
  forceDeleteActiveAudioAssetController,
  restoreAudioAssetController,
  softDeleteAllAudioAssetsController,
  permanentDeleteAllAudioAssetsController,
  restoreAllDeletedAudioAssetsController,
  softBulkDeleteAudioAssetsController,
  permanentBulkDeleteAudioAssetsController,
  bulkRestoreAudioAssetsController,
} from './audio.controller.js';

const router = Router();

//ALL OPERATIONS

router.get(
  '/narration/:narrationId',
  validateParams(narrationIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getAllAudioAssetsController)
);

router.get(
  '/narration/:narrationId/deleted',
  validateParams(narrationIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getAllDeletedAudioAssetsController)
);

router.get(
  '/narration/:narrationId/count',
  validateParams(narrationIdParamSchema),
  asyncHandler(getAudioAssetCountController)
);

router.delete(
  '/narration/:narrationId',
  validateParams(narrationIdParamSchema),
  asyncHandler(softDeleteAllAudioAssetsController)
);

router.delete(
  '/narration/:narrationId/permanent',
  validateParams(narrationIdParamSchema),
  asyncHandler(permanentDeleteAllAudioAssetsController)
);

router.post(
  '/narration/:narrationId/restore',
  validateParams(narrationIdParamSchema),
  asyncHandler(restoreAllDeletedAudioAssetsController)
);

// BULK OPERATIONS

router.post(
  '/narration/:narrationId/soft-bulk-delete',
  validateParams(narrationIdParamSchema),
  validateBody(bulkDeleteAudioAssetsSchema),
  asyncHandler(softBulkDeleteAudioAssetsController)
);

router.post(
  '/narration/:narrationId/permanent-bulk-delete',
  validateParams(narrationIdParamSchema),
  validateBody(bulkDeleteAudioAssetsSchema),
  asyncHandler(permanentBulkDeleteAudioAssetsController)
);

router.post(
  '/narration/:narrationId/bulk-restore',
  validateParams(narrationIdParamSchema),
  validateBody(bulkRestoreAudioAssetsSchema),
  asyncHandler(bulkRestoreAudioAssetsController)
);

// SINGLE OPERATIONS

router.get(
  '/narration/:narrationId/active',
  validateParams(narrationIdParamSchema),
  asyncHandler(getActiveAudioAssetController)
);

router.post(
  '/narration/:narrationId/generate',
  validateParams(narrationIdParamSchema),
  validateBody(generateAudioAssetSchema),
  asyncHandler(generateAudioAssetController)
);

router.post(
  '/narration/:narrationId/upload',
  validateParams(narrationIdParamSchema),
  audioAssetUpload,
  validateBody(uploadAudioAssetSchema),
  asyncHandler(uploadAudioAssetController)
);

router.patch(
  '/narration/:narrationId/set-active',
  validateParams(narrationIdParamSchema),
  validateBody(setActiveAudioAssetSchema),
  asyncHandler(setActiveAudioAssetController)
);

router.get(
  '/:audioAssetId',
  validateParams(audioAssetIdParamSchema),
  asyncHandler(getAudioAssetByIdController)
);

router.post(
  '/:audioAssetId/regenerate',
  validateParams(audioAssetIdParamSchema),
  validateBody(regenerateAudioAssetSchema),
  asyncHandler(regenerateAudioAssetController)
);

router.delete(
  '/:audioAssetId',
  validateParams(audioAssetIdParamSchema),
  asyncHandler(softDeleteAudioAssetController)
);

router.delete(
  '/:audioAssetId/permanent',
  validateParams(audioAssetIdParamSchema),
  asyncHandler(permanentDeleteAudioAssetController)
);

router.delete(
  '/:audioAssetId/force',
  validateParams(audioAssetIdParamSchema),
  asyncHandler(forceDeleteActiveAudioAssetController)
);

router.patch(
  '/narration/:narrationId/:audioAssetId/restore',
  validateParams(audioAssetAndNarrationParamSchema),
  asyncHandler(restoreAudioAssetController)
);

export default router;
