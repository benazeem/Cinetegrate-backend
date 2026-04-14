import { paginationResponse } from '@utils/paginationResponse.js';
import { Request, Response } from 'express';
import {
  addStoryContextService,
  archiveStory,
  createStory,
  softdeleteStory,
  permanentDeleteStory,
  getProjectArchivedStories,
  getProjectDeletedStories,
  getUserArchivedStories,
  getUserDeletedStories,
  generateStory,
  getProjectStories,
  getStoryById,
  getUserStories,
  listStoryContextProfilesService,
  regenerateStory,
  restoreStory,
  setStoryContextService,
  unarchiveStory,
  updateStory,
  writeContent,
} from './story.service.js';
import {
  AddStoryContextInput,
  CreateStoryInput,
  RegenerateStoryInput,
  SetStoryContextInput,
  UpdateStoryInput,
  WriteContentInput,
} from '@validation/story.schema.js';
import { sendSuccess, sendPaginated } from '@shared/response.js';
import { ConflictError } from '@middleware/error/index.js';

export const getUserStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getUserStories(userId, pagination, sorting);
  return sendPaginated(res, stories as any[], paginationResponse(pagination, total as number), 'Stories retrieved successfully');
};

export const getUserDeletedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getUserDeletedStories(userId, pagination, sorting);
  return sendPaginated(res, stories as any[], paginationResponse(pagination, total as number), 'Deleted stories retrieved successfully');
};

export const getUserArchivedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getUserArchivedStories(userId, pagination, sorting);
  return sendPaginated(res, stories as any[], paginationResponse(pagination, total as number), 'Archived stories retrieved successfully');
};

export const getProjectStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getProjectStories(userId, projectId, pagination, sorting);
  return sendPaginated(res, stories as any[], paginationResponse(pagination, total as number), 'Project stories retrieved successfully');
};

export const getProjectDeletedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getProjectDeletedStories(userId, projectId, pagination, sorting);
  return sendPaginated(res, stories as any[], paginationResponse(pagination, total as number), 'Project deleted stories retrieved successfully');
};

export const getProjectArchivedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getProjectArchivedStories(userId, projectId, pagination, sorting);
  return sendPaginated(res, stories as any[], paginationResponse(pagination, total as number), 'Project archived stories retrieved successfully');
};

export const createStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const payload = req.validatedBody as CreateStoryInput;
  const story = await createStory(userId, projectId, payload);
  return sendSuccess(res, story, 'Story created successfully', 201);
};

export const getStoryByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const story = await getStoryById(userId, storyId);
  return sendSuccess(res, story, 'Story retrieved successfully');
};

export const addStoryContextController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { context } = req.validatedBody as AddStoryContextInput;
  const result = await addStoryContextService(userId, storyId, context);
  return sendSuccess(res, result, 'Story context profile added', 201);
};

export const listStoryContextProfilesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const contexts = await listStoryContextProfilesService(userId, storyId);
  return sendSuccess(res, contexts, 'Story context profiles retrieved successfully');
};

export async function setStoryContextController(req: Request, res: Response) {
  const userId = req.user!.id;
  const payload = req.validatedBody as SetStoryContextInput;
  const result = await setStoryContextService(userId, req.params.storyId, payload);
  return sendSuccess(res, result, 'Story context updated');
}

export const writeContentController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as WriteContentInput;
  const story = await writeContent(userId, storyId, payload);
  return sendSuccess(res, story, 'Content added successfully');
};

export const generateStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const response = await generateStory(userId, storyId);
  return sendSuccess(res, response, 'Story generated successfully');
};

export const regenerateStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const extraPrompt = req.validatedBody as RegenerateStoryInput;
  const story = await regenerateStory(userId, storyId, extraPrompt);
  return sendSuccess(res, story, 'Story regeneration initiated');
};

export const updateStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as UpdateStoryInput;
  const story = await updateStory(userId, storyId, payload);
  return sendSuccess(res, story, 'Story updated successfully');
};

export const softdeleteStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const response = await softdeleteStory(userId, storyId);
  if (!response) {
    throw new ConflictError('Story could not be deleted');
  }
  return sendSuccess(res, { deleted: response }, 'Story deleted successfully');
};

export const permanentDeleteStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const response = await permanentDeleteStory(userId, storyId);
  if (!response) {
    throw new ConflictError('Story could not be permanently deleted');
  }
  return sendSuccess(res, { deleted: response }, 'Story permanently deleted successfully');
};

export const restoreStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const story = await restoreStory(userId, storyId);
  return sendSuccess(res, story, 'Story restored successfully');
};

export const archiveStoryStatusController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const response = await archiveStory(userId, storyId);
  return sendSuccess(res, response, 'Story archived successfully');
};

export const unarchiveStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const response = await unarchiveStory(userId, storyId);
  return sendSuccess(res, response, 'Story unarchived successfully');
};

export const rollbackStoryController = async (_req: Request, _res: Response) => {
  // to be implemented
};
