import { Router } from 'express'; 
import { createStoryController, deleteStoryController, getProjectStoriesController, getStoryByIdController, getUserStoriesController, regenerateStoryController, restoreStoryController, rollbackStoryController, unarchiveStoryController, updateStoryController, archiveStoryStatusController,  generateStoryController, writeContentController, setStoryContextController, addStoryContextController } from './story.controller.js';  
import { paginationAndSortingMiddleware } from '@middleware/paginationAndSorting.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { projectIdParamSchema } from '@validation/project.schema.js';
import { validateParams } from '@validation/validateParams.js';
import { validateBody } from '@validation/validateBody.js';
import {  addStoryContextSchema, createStorySchema, regenerateStorySchema, setStoryContextSchema, storyIdParamSchema, updateStorySchema, writeContentSchema } from '@validation/story.schema.js';

const router = Router();   
   
router.get("/", paginationAndSortingMiddleware, asyncHandler(getUserStoriesController));
router.get(
  "/project/:projectId",
  validateParams(projectIdParamSchema),
  paginationAndSortingMiddleware,
  asyncHandler(getProjectStoriesController)
)
// router.post('/', asyncHandler(createStandaloneStoryController));  Future Scope

router.post ('/project/:projectId', validateParams(projectIdParamSchema), validateBody(createStorySchema), asyncHandler(createStoryController)) 
router.get('/:storyId',validateParams(storyIdParamSchema), asyncHandler(getStoryByIdController));
router.post("/:storyId/context-profile", validateBody(addStoryContextSchema), asyncHandler(addStoryContextController));
router.patch('/:storyId/context-profile', validateParams(storyIdParamSchema), validateBody(setStoryContextSchema), asyncHandler(setStoryContextController));

router.patch('/:storyId/content', validateParams(storyIdParamSchema), validateBody(writeContentSchema), asyncHandler(writeContentController));  
router.post('/:storyId/generate',validateParams(storyIdParamSchema), asyncHandler(generateStoryController));
router.post('/:storyId/regenerate',validateParams(storyIdParamSchema), validateBody(regenerateStorySchema), asyncHandler(regenerateStoryController));

router.patch('/:storyId',validateParams(storyIdParamSchema), validateBody(updateStorySchema), asyncHandler(updateStoryController));
router.delete('/:storyId',validateParams(storyIdParamSchema), asyncHandler(deleteStoryController)); 

router.patch('/:storyId/restore',validateParams(storyIdParamSchema), asyncHandler(restoreStoryController));
router.patch('/:storyId/archive',validateParams(storyIdParamSchema), asyncHandler(archiveStoryStatusController));
router.patch('/:storyId/unarchive',validateParams(storyIdParamSchema), asyncHandler(unarchiveStoryController));
router.patch('/:storyId/rollback',validateParams(storyIdParamSchema), asyncHandler(rollbackStoryController)); // TODO: Implemenet rollback logic in controller and service

export default router;