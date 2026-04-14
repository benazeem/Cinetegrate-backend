import { Router } from 'express';
import {
  archiveAllProjectsController,
  archiveManyProjectsController,
  createProjectContextProfileController,
  updateProjectContextProfileController,
  deleteAllProjectsController,
  deleteManyProjectsController,
  deleteProjectByIdController,
  getArchivedProjectsController,
  getDeletedProjectsController,
  getDraftProjectsController,
  getProjectByIdController,
  getProjectsController,
  permanentDeleteAllProjectsController,
  permanentDeleteManyProjectsController,
  permanentDeleteProjectByIdController,
  postProjectController,
  restoreAllProjectsController,
  restoreManyProjectsController,
  restoreProjectByIdController,
  unarchiveAllProjectsController,
  unarchiveManyProjectsController,
  unarchiveProjectByIdController,
  updateProjectByIdController,
  updateProjectStatusController,
  updateProjectVisibilityController,
} from './project.controller.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { validateBody } from '@validation/validateBody.js';
import {
  createProjectContextProfileSchema,
  createProjectSchema,
  projectIdParamSchema,
  updateManyIdsSchema,
  updateProjectContextProfileSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  updateProjectVisibilitySchema,
} from '@validation/project.schema.js';
import { validateParams } from '@validation/validateParams.js';
import { paginationAndSortingMiddleware } from '@middleware/request/paginationAndSorting.js';

const router = Router();

router.get('/', paginationAndSortingMiddleware, asyncHandler(getProjectsController));
router.post('/', validateBody(createProjectSchema), asyncHandler(postProjectController));
router.get(
  '/draft',
  paginationAndSortingMiddleware,
  asyncHandler(getDraftProjectsController)
);
router.get('/delete', paginationAndSortingMiddleware, asyncHandler(getDeletedProjectsController));
router.get('/archive', paginationAndSortingMiddleware, asyncHandler(getArchivedProjectsController));

router.patch('/archive-all', asyncHandler(archiveAllProjectsController));
router.patch('/delete-all', asyncHandler(deleteAllProjectsController));
router.patch('/restore-all', asyncHandler(restoreAllProjectsController));
router.patch('/unarchive-all', asyncHandler(unarchiveAllProjectsController));
router.delete('/permanent-all', asyncHandler(permanentDeleteAllProjectsController));

// Many

router.patch('/archive', validateBody(updateManyIdsSchema), asyncHandler(archiveManyProjectsController));

router.patch('/delete', validateBody(updateManyIdsSchema), asyncHandler(deleteManyProjectsController));

router.patch('/restore', validateBody(updateManyIdsSchema), asyncHandler(restoreManyProjectsController));

router.patch('/unarchive', validateBody(updateManyIdsSchema), asyncHandler(unarchiveManyProjectsController));

router.delete(
  '/permanent',
  validateBody(updateManyIdsSchema),
  asyncHandler(permanentDeleteManyProjectsController)
);

// Project ID specific routes
router.get('/:projectId', validateParams(projectIdParamSchema), asyncHandler(getProjectByIdController));
router.post(
  '/:projectId/context-profile',
  validateParams(projectIdParamSchema),
  validateBody(createProjectContextProfileSchema),
  asyncHandler(createProjectContextProfileController)
);
router.patch(
  '/:projectId/context-profile',
  validateParams(projectIdParamSchema),
  validateBody(updateProjectContextProfileSchema),
  asyncHandler(updateProjectContextProfileController)
);
router.patch(
  '/:projectId',
  validateParams(projectIdParamSchema),
  validateBody(updateProjectSchema),
  asyncHandler(updateProjectByIdController)
);
router.delete('/:projectId', validateParams(projectIdParamSchema), asyncHandler(deleteProjectByIdController));
router.delete(
  '/:projectId/permanent',
  validateParams(projectIdParamSchema),
  asyncHandler(permanentDeleteProjectByIdController)
);
router.patch(
  '/:projectId/status',
  validateParams(projectIdParamSchema),
  validateBody(updateProjectStatusSchema),
  asyncHandler(updateProjectStatusController)
);
router.patch(
  '/:projectId/visibility',
  validateParams(projectIdParamSchema),
  validateBody(updateProjectVisibilitySchema),
  asyncHandler(updateProjectVisibilityController)
);
router.patch(
  '/:projectId/restore',
  validateParams(projectIdParamSchema),
  asyncHandler(restoreProjectByIdController)
);
router.patch(
  '/:projectId/unarchive',
  validateParams(projectIdParamSchema),
  asyncHandler(unarchiveProjectByIdController)
);

export default router;
