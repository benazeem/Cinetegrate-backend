import { Request, Response } from "express";
import {
  createProject,
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
} from "./project.service.js";
import { Types } from "mongoose";
import {
  CreateProjectInput,
  UpdateProjectInput,
  UpdateManyIdsInput,
} from "@validation/project.schema.js"; 
import { paginationResponse } from "@utils/paginationResponse.js";
import { PaginatedRequest } from "types/RequestTypes.js";

export const getProjectsController = async (req: Request, res: Response) => {
   const {pagination, sorting} = (req as PaginatedRequest);
  const [projects, total] = await getProjects(
    req.user?._id!,
    pagination,
    sorting
  );
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: projects,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getDeletedProjectsController = async (
  req: Request,
  res: Response
) => {
  const {pagination, sorting} = (req as PaginatedRequest);
  const [projects, total] = await getDeletedProjects(
    req.user?._id!,
    pagination,
    sorting
  );
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: projects,
    pagination: {
      ...paginationRes,
    },
  });
};
export const getArchivedProjectsController = async (
  req: Request,
  res: Response
) => {
   const {pagination, sorting} = (req as PaginatedRequest);
  const [projects, total] = await getArchivedProjects(
    req.user?._id!,
    pagination,
    sorting
  );
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: projects,
    pagination: {
      ...paginationRes,
    },
  });
};

export const postProjectController = async (req: Request, res: Response) => {
  const input = (req as unknown as { validatedBody?: CreateProjectInput })
    .validatedBody!;
  const newProject = await createProject(req.user?._id!, input);
  return res.status(201).json(newProject);
};

export const getProjectByIdController = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const project = await getProjectById(projectId, req.user?._id!);
  return res.status(200).json(project);
};

export const updateProjectByIdController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const updates = (req as unknown as { validatedBody?: UpdateProjectInput })
    .validatedBody!;
  const updatedProject = await updateProjectById(
    projectId,
    req.user?._id!,
    updates
  );
  return res.status(200).json(updatedProject);
};

export const deleteProjectByIdController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const response = await deleteProjectById(projectId, req.user?._id!);
  return res.status(200).json(response);
};

export const updateProjectStatusController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const { status } = req.body;
  console.log("Status:", status, "Project ID:", projectId);
  const updatedProject = await updateProjectStatus(
    projectId,
    req.user?._id!,
    status
  );
  return res.status(200).json(updatedProject);
};

export const updateProjectVisibilityController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const { visibility } = req.body; 
  const updatedProject = await updateProjectVisibility(
    projectId, 
    req.user?._id!,
    visibility
  );
  return res.status(200).json(updatedProject);
};

export const restoreProjectByIdController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const restoredProject = await restoreProjectById(projectId, req.user?._id!);
  return res.status(200).json(restoredProject);
};

export const unarchiveProjectByIdController = async (
  req: Request,
  res: Response
) => {
  const projectId = req.params.projectId as Types.ObjectId | string;
  const unarchivedProject = await unarchiveProjectById(
    projectId,
    req.user?._id!
  );
  return res.status(200).json(unarchivedProject);
};

export const restoreManyProjectsController = async (
  req: Request,
  res: Response
) => {
  const { projectIds } = (
    req as unknown as { validatedBody?: UpdateManyIdsInput }
  ).validatedBody!;
  const restoredProjects = await restoreManyProjectsByIds(
    projectIds,
    req.user?._id!
  );

  return res.status(200).json(restoredProjects);
};

export const unarchiveManyProjectsController = async (
  req: Request,
  res: Response
) => {
  const { projectIds } = (
    req as unknown as { validatedBody?: UpdateManyIdsInput }
  ).validatedBody!;
  const unarchivedProjects = await unarchiveManyProjectsByIds(
    projectIds,
    req.user?._id!
  );

  return res.status(200).json(unarchivedProjects);
};
