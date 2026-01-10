import {
  BadRequestError, 
  ForbiddenError, 
  InternalServerError,
  NotFoundError,
} from "@middleware/error/index.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@validation/project.schema.js";
import { ProjectModel, ProjectType } from "@models/Project.js";
import {
  sanitizeProjectResponse,
  sanitizeProjects,
} from "@utils/sanitizeProjectResponse.js";
import mongoose, { Types } from "mongoose";
import { Pagination, Sorting } from "../../types/Pagination.js";
import {
  ACTIVE_STATUSES, 
} from "./rules/projectStatus.js";
import { transitionManyProjectsByIds } from "./utils/transitionManyProjectsByIds.js";
import { transitionProjectById } from "./utils/transitionProjectById.js";
import { ContextProfileModel, ContextScope, GenreType } from "@models/ContextProfile.js";
import { NARRATION_PROFILES } from "constants/narrationProfiles.js";

export async function getProjects(
  userId: Types.ObjectId | string,
  pagination: Pagination,
  sorting: Sorting
) { 
  const filter = { userId, status: { $in: ACTIVE_STATUSES } };
  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder}),
    ProjectModel.countDocuments(filter) as Promise<number>,
  ]);
  if (!projects || projects.length === 0) {
    return [[], total];
  }
  const resProjects = sanitizeProjects(projects);
  return [resProjects, total];
}

export async function getDeletedProjects(
  userId: Types.ObjectId | string,
  pagination: Pagination,
  sorting: Sorting
) {
  const filter = { userId, status: "delete" };
  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder}),
    ProjectModel.countDocuments(filter) as Promise<number>,
  ]);
  if (!projects || projects.length === 0) {
    return [[], total];
  }
  const resProjects = sanitizeProjects(projects);
  return [resProjects, total];
}

export async function getArchivedProjects(
  userId: Types.ObjectId | string,
  pagination: Pagination,
  sorting: Sorting
) {
  const filter = { userId, status: "archive" };
  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder}),
    ProjectModel.countDocuments(filter) as Promise<number>,
  ]);
  if (!projects || projects.length === 0) {
    return [[], total];
  }
  const resProjects = sanitizeProjects(projects);
  return [resProjects, total];
}

export async function createProject(
  userId: Types.ObjectId | string,
  projectInput: CreateProjectInput
) {
  const newProject = await ProjectModel.create({
    userId: userId,
    title: projectInput.title,
    description: projectInput.description,
    visibility: projectInput.visibility || "private",
    status: projectInput.status,
  });
  if (!newProject) {
    throw new InternalServerError("Failed to create project");
  }
  return sanitizeProjectResponse({
    project: newProject,
    type: "getProjectById",
  });
}

export async function getProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    userId,
  });
  if (!project) {
    throw new NotFoundError("Project is not found");
  }
  return sanitizeProjectResponse({
    project: project,
    type: "getProjectById",
  });
}

export async function createProjectContextProfile(
  userId: string,
  projectId: string,
  payload: any
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await ProjectModel.findOne({
      _id: projectId,
      userId,
    }).session(session);

    if (!project) throw new Error("Project not found");

    // 🚨 CRITICAL RULE
    if (project.defaultContextProfileId) {
      throw new ForbiddenError("Project already has a default context");
    } 
    let contextProfileId;
 
    if (payload.mode === "new") {
      const narrationProfile = NARRATION_PROFILES[payload.data.genre as GenreType]; 
      const [context] = await ContextProfileModel.create(
        [
          {
            userId,
            projectId,
            name: payload.data.name,
            genre: payload.data.genre,
            mood: payload.data.mood,
            style: payload.data.style,
            environment: payload.data.environment,
            narrationProfile,
            scope: ContextScope.PROJECT,
            isDefaultForProject: true,
            lastUsedAt: new Date(),
          },
        ],
        { session }
      ); 
      contextProfileId = context._id;
    }
 
    if (payload.mode === "use-global") {
      const globalContext = await ContextProfileModel.findOne({
        _id: payload.globalContextId,
        scope: ContextScope.GLOBAL,
      }).session(session);

      if (!globalContext) {
        throw new Error("Global context not found");
      }

      // 🔒 CLONE — NEVER ATTACH DIRECTLY
      const cloned = new ContextProfileModel({
        ...globalContext.toObject(),
        _id: undefined,
        projectId,
        parentContextId: globalContext._id,
        scope: ContextScope.PROJECT,
        isDefaultForProject: true,
        lastUsedAt: new Date(),
      });

      await cloned.save({ session });
      contextProfileId = cloned._id;
    }

    project.defaultContextProfileId = contextProfileId;
    await project.save({ session }); 
    await session.commitTransaction();
    return project;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function updateProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  updates: UpdateProjectInput
) {
  const updateSet: Partial<Pick<ProjectType, "title" | "description">> = {};

  if (typeof updates.title === "string") {
    const trimmedTitle = updates.title.trim();
    if (trimmedTitle.length === 0) {
      throw new BadRequestError("Title cannot be empty");
    }
    updateSet.title = trimmedTitle;
  }

  if (typeof updates.description === "string") {
    const trimmedDescription = updates.description.trim();
    if (trimmedDescription.length === 0) {
      throw new BadRequestError("Description cannot be empty");
    }
    updateSet.description = trimmedDescription;
  }

  if (Object.keys(updateSet).length === 0) {
    throw new BadRequestError("No valid fields provided for update");
  } 

  const project = await ProjectModel.findOneAndUpdate(
    {
      _id: projectId,
      userId,
      status: { $in: ACTIVE_STATUSES },
    },
    { $set: updateSet },
    { new: true, runValidators: true }
  );
  if (!project) {
    throw new NotFoundError("Project is not found");
  }
  return sanitizeProjectResponse({
    project: project,
    type: "getProjectById",
  });
}

export async function deleteProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
   await transitionProjectById(
    projectId,
    userId,
    ["draft", "active", "archive"],
    "delete"
  ); 
    return {
    status: "success",
    message: "Project deleted successfully",
} }
 
export async function updateProjectVisibility(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  visibility: "public" | "private"
) {
  const project = await ProjectModel.findOneAndUpdate(
    {
      _id: projectId,
      userId,
      status: { $eq: "active" },
    },
    { $set: { visibility } },
    { new: true, runValidators: true }
  );
  if (!project) {
    throw new NotFoundError("Project is not found");
  }
  return sanitizeProjectResponse({
    project: project,
    type: "getProjectById",
  });
}

export async function updateProjectStatus  (
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  status: "active" | "archive" | "draft"
) {
  const result = await transitionProjectById(
    projectId,
    userId,
    ["draft", "active", "archive"],
    status
  );
  return result;
}

export async function restoreProjectById (
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
  const result = await transitionProjectById(
    projectId,
    userId,
    ["delete"],
    "active" )
  return result;
}; 

export async function unarchiveProjectById (
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
  const result = await transitionProjectById(
    projectId,
    userId,
    ["archive"],
    "active"
  );
  return result;
}

export const restoreManyProjectsByIds = async (
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) => { 
    const result = await transitionManyProjectsByIds(
    projectIds,
    userId,
    "delete",
    "active"
  );
  return result;
};

export const unarchiveManyProjectsByIds = async (
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) => {
  const result = await transitionManyProjectsByIds(
    projectIds,
    userId,
    "archive",
    "active"
  );
  return result;
};

// Future Possible Functions: ArchiveManyProjectsByIds, DeleteManyProjectsByIds
// Remember to handle visibility changes when archiving or deleting projects