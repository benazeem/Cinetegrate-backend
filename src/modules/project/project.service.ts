import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from '@middleware/error/index.js';
import type {
  CreateProjectContextInput,
  CreateProjectInput,
  UpdateProjectContextInput,
  UpdateProjectInput,
} from '@validation/project.schema.js';
import { ProjectModel, ProjectType } from '@models/Project.js';
import { sanitizeProjectResponse, sanitizeProjects } from '@utils/sanitizers/sanitizeProjectResponse.js';
import mongoose, { Types } from 'mongoose';
import type { Pagination, Sorting } from '@app-types/Pagination.js';
import { ACTIVE_STATUSES } from './rules/projectStatus.js';
import { transitionManyProjectsByIds } from './utils/transitionManyProjectsByIds.js';
import { transitionProjectById } from './utils/transitionProjectById.js';
import { ContextProfileModel, ContextScope, GenreType } from '@models/ContextProfile.js';
import { NARRATION_PROFILES } from '@constants/narrationProfiles.js';
import { withTransaction } from '@db/withTransaction.js';

export async function getProjects(userId: Types.ObjectId | string, pagination: Pagination, sorting: Sorting) {
  const filter = { userId, status: { $eq: 'active' } };
  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    ProjectModel.countDocuments(filter) as Promise<number>,
  ]);
  if (!projects || projects.length === 0) {
    return [[], total];
  }
  const resProjects = sanitizeProjects(projects);
  return [resProjects, total];
}

export async function getDraftProjects(
  userId: Types.ObjectId | string,
  pagination: Pagination,
  sorting: Sorting
) {
  const filter = {
    userId,
    status: 'draft',
  };

  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    ProjectModel.countDocuments(filter),
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
  const filter = { userId, status: 'delete' };
  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
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
  const filter = { userId, status: 'archive' };
  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    ProjectModel.countDocuments(filter) as Promise<number>,
  ]);
  if (!projects || projects.length === 0) {
    return [[], total];
  }
  const resProjects = sanitizeProjects(projects);
  return [resProjects, total];
}

export async function archiveAllProjects(userId: Types.ObjectId | string) {
  const projects = await ProjectModel.find({
    userId,
    status: 'active',
  }).select('_id');

  if (projects.length === 0) {
    throw new NotFoundError('No active projects to archive');
  }

  const ids = projects.map((p) => p._id);

  return transitionManyProjectsByIds(ids, userId, ['active'], 'archive');
}

export async function deleteAllProjects(userId: Types.ObjectId | string) {
  const projects = await ProjectModel.find({
    userId,
    status: { $ne: 'delete' },
  }).select('_id');

  if (projects.length === 0) {
    throw new NotFoundError('No projects to delete');
  }

  return transitionManyProjectsByIds(
    projects.map((p) => p._id),
    userId,
    ['draft', 'active', 'archive'],
    'delete'
  );
}

export async function restoreAllProjects(userId: Types.ObjectId | string) {
  const projects = await ProjectModel.find({
    userId,
    status: 'delete',
  }).select('_id');

  if (projects.length === 0) {
    throw new NotFoundError('No deleted projects to restore');
  }

  return transitionManyProjectsByIds(
    projects.map((p) => p._id),
    userId,
    ['delete'],
    'active'
  );
}

export async function unarchiveAllProjects(userId: Types.ObjectId | string) {
  const projects = await ProjectModel.find({
    userId,
    status: 'archive',
  }).select('_id');

  if (projects.length === 0) {
    throw new NotFoundError('No archived projects to restore');
  }

  return transitionManyProjectsByIds(
    projects.map((p) => p._id),
    userId,
    ['archive'],
    'active'
  );
}

export async function permanentDeleteAllProjects(userId: Types.ObjectId | string) {
  const result = await ProjectModel.deleteMany({
    userId,
    status: 'delete',
  });

  if (!result.deletedCount) {
    throw new NotFoundError('No deleted projects to permanently remove');
  }

  return { deletedCount: result.deletedCount };
}

// Bulk or Many

export async function deleteManyProjectsByIds(
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) {
  return transitionManyProjectsByIds(projectIds, userId, ['draft', 'active', 'archive'], 'delete');
}

export const restoreManyProjectsByIds = async (
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) => {
  const result = await transitionManyProjectsByIds(projectIds, userId, ['delete'], 'active');
  return result;
};

export async function archiveManyProjectsByIds(
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) {
  return transitionManyProjectsByIds(projectIds, userId, ['active'], 'archive');
}

export const unarchiveManyProjectsByIds = async (
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) => {
  const result = await transitionManyProjectsByIds(projectIds, userId, ['archive'], 'active');
  return result;
};

export async function permanentDeleteManyProjects(
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string
) {
  const projects = await ProjectModel.find({
    _id: { $in: projectIds },
    userId,
    status: 'delete',
  });

  if (projects.length !== projectIds.length) {
    throw new BadRequestError('Some projects are not deleted');
  }

  const result = await ProjectModel.deleteMany({
    _id: { $in: projectIds },
    userId,
  });

  return { deletedCount: result.deletedCount || 0 };
}

// Single

export async function createProject(userId: Types.ObjectId | string, projectInput: CreateProjectInput) {
  const newProject = await ProjectModel.create({
    userId: userId,
    title: projectInput.title,
    description: projectInput.description,
    visibility: projectInput.visibility || 'private',
    // A project stays draft until a default context profile is attached.
    status: 'draft',
  });
  if (!newProject) {
    throw new InternalServerError('Failed to create project');
  }
  return sanitizeProjectResponse({
    project: newProject,
    type: 'getProjectById',
  });
}

export async function getProjectById(projectId: Types.ObjectId | string, userId: Types.ObjectId | string) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    userId,
  });
  if (!project) {
    throw new NotFoundError('Project is not found');
  }
  return sanitizeProjectResponse({
    project: project,
    type: 'getProjectById',
  });
}

export async function createProjectContextProfile(
  userId: string,
  projectId: string,
  payload: CreateProjectContextInput
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await ProjectModel.findOne({
      _id: projectId,
      userId,
    }).session(session);

    if (!project) throw new NotFoundError('Project not found');

    const existingContext = await ContextProfileModel.findOne({
      projectId: project._id,
      isDefaultForProject: true,
    }).session(session);

    if (existingContext) {
      throw new ForbiddenError('Project already has a default context');
    }

    // 🚨 CRITICAL RULE
    if (project.defaultContextProfileId) {
      throw new ForbiddenError('Project already has a default context');
    }
    let contextProfileId: Types.ObjectId | undefined;

    if (payload.mode === 'new') {
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

    if (payload.mode === 'use-global') {
      const globalContext = await ContextProfileModel.findOne({
        _id: payload.globalContextId,
        scope: ContextScope.GLOBAL,
      }).session(session);

      if (!globalContext) {
        throw new NotFoundError('Global context not found');
      }

      // 🔒 CLONE — NEVER ATTACH DIRECTLY
      const cloned = new ContextProfileModel({
        ...globalContext.toObject(),
        _id: undefined,
        projectId,
        scope: ContextScope.PROJECT,
        parentContextId: globalContext._id,
        isDefaultForProject: true,
        lastUsedAt: new Date(),
      });

      await cloned.save({ session });
      contextProfileId = cloned._id;
    }

    if (!contextProfileId) {
      throw new BadRequestError('Invalid context creation mode');
    }

    project.defaultContextProfileId = contextProfileId;
    if (project.status === 'draft') {
      project.status = 'active';
    }
    await project.save({ session });
    await session.commitTransaction();
    return sanitizeProjectResponse({
      project,
      type: 'getProjectById',
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// TODO:createUpdatedContextProfile function

export async function updateProjectContextProfile(
  userId: string,
  projectId: string,
  payload: UpdateProjectContextInput
) {
  return withTransaction(async (session) => {
    const project = await ProjectModel.findOne({ _id: projectId, userId }).session(session);
    if (!project) throw new NotFoundError('Project not found');

    const narrationProfile = NARRATION_PROFILES[payload.genre as GenreType];

    const [newContext] = await ContextProfileModel.create(
      [
        {
          userId,
          projectId,
          name: payload.name,
          description: payload.description,
          genre: payload.genre,
          mood: payload.mood,
          style: payload.style,
          narrativeScope: payload.narrativeScope,
          environment: payload.environment,
          worldRules: payload.worldRules,
          narrativeConstraints: payload.narrativeConstraints,
          characters: payload.characters,
          forbiddenElements: payload.forbiddenElements,
          narrationProfile,
          scope: ContextScope.PROJECT,
          isDefaultForProject: true,
          lastUsedAt: new Date(),
        },
      ],
      { session }
    );

    // Demote the previous default
    if (project.defaultContextProfileId) {
      await ContextProfileModel.updateOne(
        { _id: project.defaultContextProfileId },
        { $set: { isDefaultForProject: false } },
        { session }
      );
    }

    project.defaultContextProfileId = newContext._id;
    await project.save({ session });

    return sanitizeProjectResponse({ project, type: 'getProjectById' });
  });
}

export async function updateProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  updates: UpdateProjectInput
) {
  const updateSet: Partial<Pick<ProjectType, 'title' | 'description'>> = {};

  if (typeof updates.title === 'string') {
    const trimmedTitle = updates.title.trim();
    if (trimmedTitle.length === 0) {
      throw new BadRequestError('Title cannot be empty');
    }
    updateSet.title = trimmedTitle;
  }

  if (typeof updates.description === 'string') {
    const trimmedDescription = updates.description.trim();
    if (trimmedDescription.length === 0) {
      throw new BadRequestError('Description cannot be empty');
    }
    updateSet.description = trimmedDescription;
  }

  if (Object.keys(updateSet).length === 0) {
    throw new BadRequestError('No valid fields provided for update');
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
    throw new NotFoundError('Project is not found');
  }
  return sanitizeProjectResponse({
    project: project,
    type: 'getProjectById',
  });
}

export async function deleteProjectById(projectId: Types.ObjectId | string, userId: Types.ObjectId | string) {
  await transitionProjectById(projectId, userId, ['draft', 'active', 'archive'], 'delete');
  return {
    status: 'success',
    message: 'Project deleted successfully',
  };
}

export async function permanentDeleteProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    userId,
  }).select('_id status');

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.status !== 'delete') {
    throw new ForbiddenError('Project must be deleted before permanent removal');
  }

  await ProjectModel.deleteOne({
    _id: project._id,
    userId,
  });

  return {
    status: 'success',
    message: 'Project permanently deleted',
  };
}

export async function updateProjectVisibility(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  visibility: 'public' | 'private'
) {
  const project = await ProjectModel.findOneAndUpdate(
    {
      _id: projectId,
      userId,
      status: { $eq: 'active' },
    },
    { $set: { visibility } },
    { new: true, runValidators: true }
  );
  if (!project) {
    throw new NotFoundError('Project is not found');
  }
  return sanitizeProjectResponse({
    project: project,
    type: 'getProjectById',
  });
}

export async function updateProjectStatus(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string,
  status: 'active' | 'archive' | 'draft'
) {
  const result = await transitionProjectById(projectId, userId, ['draft', 'active', 'archive'], status);
  return result;
}

export async function restoreProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
  const result = await transitionProjectById(projectId, userId, ['delete'], 'active');
  return result;
}

export async function unarchiveProjectById(
  projectId: Types.ObjectId | string,
  userId: Types.ObjectId | string
) {
  const result = await transitionProjectById(projectId, userId, ['archive'], 'active');
  return result;
}

// Future Possible Functions: ArchiveManyProjectsByIds, DeleteManyProjectsByIds
// Remember to handle visibility changes when archiving or deleting projects
