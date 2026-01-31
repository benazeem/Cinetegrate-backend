import { Router } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { validateParams } from '@validation/validateParams.js';
import { validateBody } from '@validation/validateBody.js';

import {
  storyIdParamSchema,
  sceneAndStoryParamSchema,
  createSceneSchema,
  updateSceneSchema,
  moveSceneSchema,
  bulkReorderSchema,
  bulkRestoreSchema,
  generateSceneSchema,
  regenerateSceneSchema,
  generateAllScenesSchema,
  durationSchema,
} from '@validation/scenes.schema.js';

import {
  getAllStoryScenesController,
  getAllInactiveStoryScenesController,
  getAllDeletedScenesController,
  getSceneByIdController,
  createSceneController,
  updateSceneController,
  softDeleteSceneController,
  permanentDeleteAllScenesController,
  restoreSceneController,
  moveSceneController,
  bulkReorderController,
  bulkRestoreScenesController,
  bulkSoftDeleteScenesController,
  bulkPermanentDeleteScenesController,
  restoreAllDeletedScenesController,
  softDeleteAllScenesController,
  permanentDeleteSceneController,
  generateScenesController,
  regenerateScenesController,
  generateSingleSceneController,
  regenerateSceneController,
  getSceneCountController,
  updateSceneDurationController,
  deactivateSceneController,
  reactivateSceneController,
} from './scenes.controller.js';

const router = Router();

// ALL SCENES ROUTES FOR A STORY

router.get('/:storyId', validateParams(storyIdParamSchema), asyncHandler(getAllStoryScenesController));
router.get(
  '/:storyId/inactive',
  validateParams(storyIdParamSchema),
  asyncHandler(getAllInactiveStoryScenesController)
);

router.get(
  '/:storyId/deleted',
  validateParams(storyIdParamSchema),
  asyncHandler(getAllDeletedScenesController)
);

router.get('/:storyId/count', validateParams(storyIdParamSchema), asyncHandler(getSceneCountController));

router.post(
  '/:storyId/scenes/restore-all',
  validateParams(storyIdParamSchema),
  asyncHandler(restoreAllDeletedScenesController)
);

router.delete(
  '/:storyId/scenes/soft',
  validateParams(storyIdParamSchema),
  asyncHandler(softDeleteAllScenesController)
);

router.delete(
  '/:storyId/scenes/permanent',
  validateParams(storyIdParamSchema),
  asyncHandler(permanentDeleteAllScenesController)
);

// BULK SCENES ROUTES

router.post(
  '/:storyId/scenes/reorder',
  validateParams(storyIdParamSchema),
  validateBody(bulkReorderSchema),
  asyncHandler(bulkReorderController)
);

router.post(
  '/:storyId/scenes/restore-bulk',
  validateParams(storyIdParamSchema),
  validateBody(bulkRestoreSchema),
  asyncHandler(bulkRestoreScenesController)
);

router.post(
  '/:storyId/scenes/soft-delete-bulk',
  validateParams(storyIdParamSchema),
  validateBody(bulkRestoreSchema),
  asyncHandler(bulkSoftDeleteScenesController)
);

router.post(
  '/:storyId/scenes/permanent-delete-bulk',
  validateParams(storyIdParamSchema),
  validateBody(bulkRestoreSchema),
  asyncHandler(bulkPermanentDeleteScenesController)
);

// SINGLE SCENE ROUTES

router.post(
  '/:storyId/generate',
  validateParams(storyIdParamSchema),
  validateBody(generateAllScenesSchema),
  asyncHandler(generateScenesController)
);

router.post(
  '/:storyId/regenerate',
  validateParams(storyIdParamSchema),
  validateBody(regenerateSceneSchema),
  asyncHandler(regenerateScenesController)
);

router.get(
  '/:storyId/scene/:sceneId',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(getSceneByIdController)
);

router.post(
  '/:storyId/scene',
  validateParams(storyIdParamSchema),
  validateBody(createSceneSchema),
  asyncHandler(createSceneController)
);

router.post(
  '/:storyId/scene/generate',
  validateParams(storyIdParamSchema),
  validateBody(generateSceneSchema),
  asyncHandler(generateSingleSceneController)
);

router.patch(
  '/:storyId/scene/:sceneId',
  validateParams(sceneAndStoryParamSchema),
  validateBody(updateSceneSchema),
  asyncHandler(updateSceneController)
);

router.patch(
  '/:storyId/scene/:sceneId/duration',
  validateParams(sceneAndStoryParamSchema),
  validateBody(durationSchema),
  asyncHandler(updateSceneDurationController)
);

router.post(
  '/:storyId/scene/:sceneId/deactivate',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(deactivateSceneController)
);

router.post(
  '/:storyId/scene/:sceneId/reactivate',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(reactivateSceneController)
);

router.delete(
  '/:storyId/scene/:sceneId/soft',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(softDeleteSceneController)
);

router.delete(
  '/:storyId/scene/:sceneId/permanent',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(permanentDeleteSceneController)
);

router.post(
  '/:storyId/scene/:sceneId/restore',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(restoreSceneController)
);

router.patch(
  '/:storyId/scene/:sceneId/move',
  validateParams(sceneAndStoryParamSchema),
  validateBody(moveSceneSchema),
  asyncHandler(moveSceneController)
);

router.post(
  '/:storyId/scene/:sceneId/regenerate',
  validateParams(sceneAndStoryParamSchema),
  validateBody(regenerateSceneSchema),
  asyncHandler(regenerateSceneController)
);

export default router;
