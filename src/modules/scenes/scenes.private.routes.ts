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
  getSceneByIdController,
  createSceneController,
  updateSceneController,
  deleteSceneController,
  restoreSceneController,
  moveSceneController,
  bulkReorderController,
  bulkRestoreScenesController,
  restoreAllDeletedScenesController,
  generateScenesController,
  regenerateScenesController,
  generateSingleSceneController,
  regenerateSceneController,
  getSceneCountController,
  getAllDeltedScenesController,
  updateSceneDurationController,
} from './scenes.controller.js';

const router = Router();

// ALL SCENES ROUTES FOR A STORY

router.get('/:storyId', validateParams(storyIdParamSchema), asyncHandler(getAllStoryScenesController));

router.get('/:storyId/deleted', validateParams(storyIdParamSchema), asyncHandler(getAllDeltedScenesController));

router.get('/:storyId/count', validateParams(storyIdParamSchema), asyncHandler(getSceneCountController));

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
  '/:storyId/scenes/restore-all',
  validateParams(storyIdParamSchema),
  asyncHandler(restoreAllDeletedScenesController)
);

// SINGLE SCENE ROUTES

router.get('/:storyId/scene/:sceneId', validateParams(sceneAndStoryParamSchema), asyncHandler(getSceneByIdController));

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

router.delete(
  '/:storyId/scene/:sceneId',
  validateParams(sceneAndStoryParamSchema),
  asyncHandler(deleteSceneController)
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
