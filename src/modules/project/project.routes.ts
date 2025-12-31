import { Router } from "express";
import {
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
  createProjectSchema,
  projectIdParamSchema,
  updateManyIdsSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  updateProjectVisibilitySchema,
} from "@validation/project.schema.js";
import { validateParams } from "@validation/validateParams.js";

const router = Router();

router.get("/", asyncHandler(getProjectsController));
router.post(
  "/",
  validateBody(createProjectSchema),
  asyncHandler(postProjectController)
);
router.get("/deleted", asyncHandler(getDeletedProjectsController));
router.get("/archived", asyncHandler(getArchivedProjectsController));
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



router.get(
  "/:projectId",
  validateParams(projectIdParamSchema),
  asyncHandler(getProjectByIdController)
);
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
// Routes which go from a single project
// router.use("/projects/:projectId", contextRouter);
// router.use("/projects/:projectId", storyRouter);
// router.use("/projects/:projectId", assetRouter);
// router.use("/projects/:projectId", videosRouter); // finally videos routes

export default router;
