import { Request, Response } from 'express';
import {
  archiveAllProjects,
  archiveManyProjectsByIds,
  createProject,
  createProjectContextProfile,
  updateProjectContextProfile,
  deleteAllProjects,
  deleteManyProjectsByIds,
  deleteProjectById,
  getArchivedProjects,
  getDeletedProjects,
  getProjectById,
  getProjects,
  permanentDeleteAllProjects,
  permanentDeleteManyProjects,
  permanentDeleteProjectById,
  restoreAllProjects,
  restoreManyProjectsByIds,
  restoreProjectById,
  unarchiveManyProjectsByIds,
  unarchiveProjectById,
  updateProjectById,
  updateProjectStatus,
  updateProjectVisibility,
  unarchiveAllProjects,
  getDraftProjects,
} from './project.service.js';
import { Types } from 'mongoose';
import {
  CreateProjectInput,
  UpdateProjectInput,
  UpdateManyIdsInput,
  CreateProjectContextInput,
  UpdateProjectContextInput,
} from '@validation/project.schema.js';
import { paginationResponse } from '@utils/paginationResponse.js';
import { sendSuccess, sendPaginated } from '@shared/response.js';

export const getProjectsController = async (req: Request, res: Response) => {
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getProjects(userId, pagination, sorting);

  return sendPaginated(
    res,
    projects as any[],
    paginationResponse(pagination, total as number),
    'Projects retrieved successfully'
  );
};

export const getDraftProjectsController = async (req: Request, res: Response) => {
  const pagination = req.pagination!;
  const sorting = req.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getDraftProjects(userId, pagination, sorting);
  return sendPaginated(
    res,
    projects as any[],
    paginationResponse(pagination, total as number),
    'Draft projects retrieved successfully'
  );
};

export const getDeletedProjectsController = async (req: Request, res: Response) => {
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getDeletedProjects(userId, pagination, sorting);
  return sendPaginated(
    res,
    projects as any[],
    paginationResponse(pagination, total as number),
    'Deleted projects retrieved successfully'
  );
};

export const getArchivedProjectsController = async (req: Request, res: Response) => {
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const userId = req.user!.id;
  const [projects, total] = await getArchivedProjects(userId, pagination, sorting);
  return sendPaginated(
    res,
    projects as any[],
    paginationResponse(pagination, total as number),
    'Archived projects retrieved successfully'
  );
};

export const archiveAllProjectsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await archiveAllProjects(userId);
  return sendSuccess(res, result, 'All projects archived successfully');
};

export const unarchiveAllProjectsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await unarchiveAllProjects(userId);
  return sendSuccess(res, result, 'All projects unarchived successfully');
};

export const deleteAllProjectsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await deleteAllProjects(userId);
  return sendSuccess(res, result, 'All projects deleted successfully');
};

export const permanentDeleteAllProjectsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await permanentDeleteAllProjects(userId);
  return sendSuccess(res, result, 'All projects permanently deleted');
};

export const restoreAllProjectsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await restoreAllProjects(userId);
  return sendSuccess(res, result, 'All projects restored successfully');
};

export const deleteManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const result = await deleteManyProjectsByIds(projectIds, userId);
  return sendSuccess(res, result, 'Projects deleted successfully');
};

export const permanentDeleteManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const result = await permanentDeleteManyProjects(projectIds, userId);
  return sendSuccess(res, result, 'Projects permanently deleted');
};

export const restoreManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const restoredProjects = await restoreManyProjectsByIds(projectIds, userId);
  return sendSuccess(res, restoredProjects, 'Projects restored successfully');
};

export const archiveManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const result = await archiveManyProjectsByIds(projectIds, userId);
  return sendSuccess(res, result, 'Projects archived successfully');
};

export const unarchiveManyProjectsController = async (req: Request, res: Response) => {
  const { projectIds } = req.validatedBody as UpdateManyIdsInput;
  const userId = req.user!.id;
  const unarchivedProjects = await unarchiveManyProjectsByIds(projectIds, userId);
  return sendSuccess(res, unarchivedProjects, 'Projects unarchived successfully');
};

export const postProjectController = async (req: Request, res: Response) => {
  const input = req.validatedBody as CreateProjectInput;
  const userId = req.user!.id;
  const newProject = await createProject(userId, input);
  return sendSuccess(res, newProject, 'Project created successfully', 201);
};

export const getProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const project = await getProjectById(projectId, userId);
  return sendSuccess(res, project, 'Project retrieved successfully');
};

export const createProjectContextProfileController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const payload = req.validatedBody as CreateProjectContextInput;
  const userId = req.user!.id;
  const newProject = await createProjectContextProfile(userId, projectId, payload);
  return sendSuccess(res, newProject, 'Project context profile created successfully', 201);
};

export const updateProjectContextProfileController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  const payload = req.validatedBody as UpdateProjectContextInput;
  const userId = req.user!.id;
  const updatedProject = await updateProjectContextProfile(userId, projectId, payload);
  return sendSuccess(res, updatedProject, 'Project context profile updated successfully');
};

export const updateProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const updates = req.validatedBody as UpdateProjectInput;
  const userId = req.user!.id;
  const updatedProject = await updateProjectById(projectId, userId, updates);
  return sendSuccess(res, updatedProject, 'Project updated successfully');
};

export const deleteProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const response = await deleteProjectById(projectId, userId);
  return sendSuccess(res, response, 'Project deleted successfully');
};

export const permanentDeleteProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const result = await permanentDeleteProjectById(projectId, userId);
  return sendSuccess(res, result, 'Project permanently deleted');
};

export const updateProjectStatusController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const { status } = req.body;
  const userId = req.user!.id;
  const updatedProject = await updateProjectStatus(projectId, userId, status);
  return sendSuccess(res, updatedProject, 'Project status updated successfully');
};

export const updateProjectVisibilityController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const { visibility } = req.body;
  const userId = req.user!.id;
  const updatedProject = await updateProjectVisibility(projectId, userId, visibility);
  return sendSuccess(res, updatedProject, 'Project visibility updated successfully');
};

export const restoreProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const restoredProject = await restoreProjectById(projectId, userId);
  return sendSuccess(res, restoredProject, 'Project restored successfully');
};

export const unarchiveProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const userId = req.user!.id;
  const unarchivedProject = await unarchiveProjectById(projectId, userId);
  return sendSuccess(res, unarchivedProject, 'Project unarchived successfully');
};
