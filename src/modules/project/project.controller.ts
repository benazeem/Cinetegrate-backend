import { Request, Response } from 'express';
import {
  createProject,
  createProjectContextProfile,
  deleteProjectById,
  getArchivedProjects,
  getDeletedProjects,
  getProjectById,
  getProjects,
  restoreManyProjectsByIds,
  restoreProjectById,
  unarchiveManyProjectsByIds,
  unarchiveProjectById,
  updateProjectById,
  updateProjectStatus,
  updateProjectVisibility,
} from './project.service.js';
import { Types } from 'mongoose';
import {
  CreateProjectInput,
  UpdateProjectInput,
  UpdateManyIdsInput,
  CreateProjectContextInput,
} from '@validation/project.schema.js';
import { paginationResponse } from '@utils/paginationResponse.js';

export const getProjectsController = async (req: Request, res: Response) => {
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getProjects(userId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: projects,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getDeletedProjectsController = async (req: Request, res: Response) => {
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getDeletedProjects(userId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: projects,
    pagination: {
      ...paginationRes,
    },
  });
};
export const getArchivedProjectsController = async (req: Request, res: Response) => {
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getArchivedProjects(userId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: projects,
    pagination: {
      ...paginationRes,
    },
  });
};

export const postProjectController = async (req: Request, res: Response) => {
  const input = req.validatedBody as CreateProjectInput;
  const userId = req.user!.id;
  const newProject = await createProject(userId, input);
  return res.status(201).json(newProject);
};

export const getProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const project = await getProjectById(projectId, userId);
  return res.status(200).json(project);
};

export const createProjectContextProfileController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const payload = req.validatedBody as CreateProjectContextInput;
  const userId = req.user!.id;
  const newProject = await createProjectContextProfile(userId, projectId, payload);
  return res.status(201).json(newProject);
};

export const updateProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const updates = req.validatedBody as UpdateProjectInput;
  const userId = req.user!.id;
  const updatedProject = await updateProjectById(projectId, userId, updates);
  return res.status(200).json(updatedProject);
};

export const deleteProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const response = await deleteProjectById(projectId, userId);
  return res.status(200).json(response);
};

export const updateProjectStatusController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const { status } = req.body;
  const userId = req.user!.id;
  const updatedProject = await updateProjectStatus(projectId, userId, status);
  return res.status(200).json(updatedProject);
};

export const updateProjectVisibilityController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const { visibility } = req.body;
  const userId = req.user!.id;
  const updatedProject = await updateProjectVisibility(projectId, userId, visibility);
  return res.status(200).json(updatedProject);
};

export const restoreProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const restoredProject = await restoreProjectById(projectId, userId);
  return res.status(200).json(restoredProject);
};

export const unarchiveProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const unarchivedProject = await unarchiveProjectById(projectId, userId);
  return res.status(200).json(unarchivedProject);
};

export const restoreManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const restoredProjects = await restoreManyProjectsByIds(projectIds, userId);

  return res.status(200).json(restoredProjects);
};

export const unarchiveManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const unarchivedProjects = await unarchiveManyProjectsByIds(projectIds, userId);

  return res.status(200).json(unarchivedProjects);
};
