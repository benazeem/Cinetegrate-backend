import { Router } from 'express';
import {
  getActiveNarrationController,
  getAllNarrationsForStoryController,
  getNarrationByIdController,
  getAllDeletedNarrationsController,
  generateNarrationController,
  regenerateNarrationController,
  uploadNarrationJSONController,
  uploadNarrationFileController,
  updateNarrationSegmentsController,
  deleteNarrationController,
  restoreNarrationController,
  switchActiveNarrationController,
  createEmptyNarrationController,
} from './narration.controller.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { validateParams } from '@validation/validateParams.js';
import { validateBody } from '@validation/validateBody.js';
import {
  narrationIdParamSchema,
  storyIdParamSchema,
  storyNarrationParamSchema,
  regenerateNarrationSchema,
  uploadNarrationJSONSchema,
  updateNarrationSegmentsSchema,
} from '@validation/narration.schema.js';
import { narrationJSONUpload } from '@middleware/multer/narrationJSONUpload.js';
import { paginationAndSortingMiddleware } from '@middleware/request/paginationAndSorting.js';

const router = Router();

router.get(
  '/story/:storyId/all',
  validateParams(storyIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getAllNarrationsForStoryController)
);

router.get(
  '/story/:storyId/deleted',
  validateParams(storyIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getAllDeletedNarrationsController)
);

// Single narration routes

router.get(
  '/story/:storyId/active',
  validateParams(storyIdParamSchema),
  asyncHandler(getActiveNarrationController)
);

router.post(
  '/story/:storyId',
  validateParams(storyIdParamSchema),
  asyncHandler(createEmptyNarrationController)
);

router.post(
  '/story/:storyId/generate',
  validateParams(storyIdParamSchema),
  asyncHandler(generateNarrationController)
);

router.post(
  '/story/:storyId/regenerate',
  validateParams(storyIdParamSchema),
  validateBody(regenerateNarrationSchema),
  asyncHandler(regenerateNarrationController)
);

router.post(
  '/story/:storyId/upload-json',
  validateParams(storyIdParamSchema),
  validateBody(uploadNarrationJSONSchema),
  asyncHandler(uploadNarrationJSONController)
);

router.post(
  '/story/:storyId/upload-file',
  validateParams(storyIdParamSchema),
  narrationJSONUpload,
  asyncHandler(uploadNarrationFileController)
);

router.get('/:narrationId', validateParams(narrationIdParamSchema), asyncHandler(getNarrationByIdController));

router.patch(
  '/story/:storyId/:narrationId/segments',
  validateParams(storyNarrationParamSchema),
  validateBody(updateNarrationSegmentsSchema),
  asyncHandler(updateNarrationSegmentsController)
);

router.patch(
  '/:narrationId/activate',
  validateParams(narrationIdParamSchema),
  asyncHandler(switchActiveNarrationController)
);

router.delete(
  '/:narrationId',
  validateParams(narrationIdParamSchema),
  asyncHandler(deleteNarrationController)
);

router.patch(
  '/:narrationId/restore',
  validateParams(narrationIdParamSchema),
  asyncHandler(restoreNarrationController)
);

export default router;
