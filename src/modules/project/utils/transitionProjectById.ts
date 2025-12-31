import { ConflictError, NotFoundError } from "@middleware/error/index.js";
import { sanitizeProjectResponse } from "@utils/sanitizeProjectResponse.js";
import { canTransition, ProjectStatus } from "../rules/projectStatus.js";
import { ProjectModel } from "@models/Project.js";
import { Types } from "mongoose";

export async function transitionProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  fromStatuses: ProjectStatus[],
  toStatus: ProjectStatus
) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    userId,
    status: { $in: fromStatuses },
  });

  if (!project) {
    throw new NotFoundError("Project is not found");
  }

  if (
    toStatus !== project.status &&
    !canTransition(
      project.status,
      toStatus
    )
  ) {
    throw new ConflictError(
      `Cannot transition project status from ${project.status} to ${toStatus}`
    );
  }

  project.status = toStatus;

  if (toStatus === "archive" || toStatus === "delete") {
    project.visibility = "private";
  }

  await project.save();

  return sanitizeProjectResponse({
    project,
    type: "getProjectById",
  });
}
