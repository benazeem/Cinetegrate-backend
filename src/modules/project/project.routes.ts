 import { Router } from "express";
import {
  createProjectContextProfileController,
  deleteProjectByIdController,
  getArchivedProjectsController,
  getDeletedProjectsController,
  getProjectByIdController,
  getProjectsController,
  postProjectController,
  restoreManyProjectsController,
  restoreProjectByIdController,
  unarchiveManyProjectsController,
  unarchiveProjectByIdController,
  updateProjectByIdController,
  updateProjectStatusController,
  updateProjectVisibilityController,
} from "./project.controller.js";
import { asyncHandler } from "@utils/asyncHandler.js";
import { validateBody } from "@validation/validateBody.js";
import {
  createProjectContextProfileSchema,
  createProjectSchema,
  projectIdParamSchema,
  updateManyIdsSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  updateProjectVisibilitySchema,
} from "@validation/project.schema.js";
import { validateParams } from "@validation/validateParams.js";
import { paginationAndSortingMiddleware } from "@middleware/paginationAndSorting.js"; 

const router = Router();

router.get("/", paginationAndSortingMiddleware, asyncHandler(getProjectsController));
router.post(
  "/",
  validateBody(createProjectSchema),
  asyncHandler(postProjectController)
);
router.get("/deleted", paginationAndSortingMiddleware, asyncHandler(getDeletedProjectsController));
router.get("/archived", paginationAndSortingMiddleware, asyncHandler(getArchivedProjectsController));
router.patch(
  "/restore",
  validateBody(updateManyIdsSchema),
  asyncHandler(restoreManyProjectsController)
);
router.patch(
  "/unarchive",
  validateBody(updateManyIdsSchema),
  asyncHandler(unarchiveManyProjectsController)
);
 
// Project ID specific routes
router.get(
  "/:projectId",
  validateParams(projectIdParamSchema),
  asyncHandler(getProjectByIdController)
);
router.post(
  "/:projectId/context-profile",
  validateParams(projectIdParamSchema),
  validateBody(createProjectContextProfileSchema),
  asyncHandler(createProjectContextProfileController));
router.patch(
  "/:projectId",
  validateParams(projectIdParamSchema),
  validateBody(updateProjectSchema),
  asyncHandler(updateProjectByIdController)
);
router.delete(
  "/:projectId",
  validateParams(projectIdParamSchema),
  asyncHandler(deleteProjectByIdController)
);
router.patch(
  "/:projectId/status",
  validateParams(projectIdParamSchema),
  validateBody(updateProjectStatusSchema),
  asyncHandler(updateProjectStatusController)
);
router.patch(
  "/:projectId/visibility",
  validateParams(projectIdParamSchema),
  validateBody(updateProjectVisibilitySchema),
  asyncHandler(updateProjectVisibilityController)
);
router.patch(
  "/:projectId/restore",
  validateParams(projectIdParamSchema),
  asyncHandler(restoreProjectByIdController)
);
router.patch(
  "/:projectId/unarchive",
  validateParams(projectIdParamSchema),
  asyncHandler(unarchiveProjectByIdController)
);

export default router;