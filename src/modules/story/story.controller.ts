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

export const getUserStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getUserStories(userId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: stories,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getUserDeletedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getUserDeletedStories(userId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: stories,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getUserArchivedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getUserArchivedStories(userId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: stories,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getProjectStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getProjectStories(userId, projectId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: stories,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getProjectDeletedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getProjectDeletedStories(userId, projectId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: stories,
    pagination: {
      ...paginationRes,
    },
  });
};

export const getProjectArchivedStoriesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [stories, total] = await getProjectArchivedStories(userId, projectId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);
  return res.status(200).json({
    items: stories,
    pagination: {
      ...paginationRes,
    },
  });
};

export const createStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId;
  const payload = req.validatedBody as CreateStoryInput;

  const story = await createStory(userId, projectId, payload);

  return res.status(201).json({
    message: 'Story created successfully',
    story,
  });
};

export const getStoryByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const story = await getStoryById(userId, storyId);
  return res.status(200).json({
    story,
  });
};

export const addStoryContextController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { context } = req.validatedBody as AddStoryContextInput;
  const result = await addStoryContextService(userId, storyId, context);
  res.status(201).json({
    message: 'Story context profile added',
    data: result,
  });
};

export async function setStoryContextController(req: Request, res: Response) {
  const userId = req.user!.id;
  const payload = req.validatedBody as SetStoryContextInput;

  const result = await setStoryContextService(userId, req.params.storyId, payload);

  res.status(200).json({
    message: 'Story context updated',
    data: result,
  });
}

export const writeContentController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as WriteContentInput;

  const story = await writeContent(userId, storyId, payload);
  return res.status(200).json({
    message: 'Content added successfully',
    data: story,
  });
};

export const generateStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const response = await generateStory(userId, storyId);
  return res.status(200).json({
    message: 'Story generated successfully',
    data: response,
  });
};

export const regenerateStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const extraPrompt = req.validatedBody as RegenerateStoryInput;

  const story = await regenerateStory(userId, storyId, extraPrompt);

  return res.status(200).json({
    message: 'Story regeneration initiated',
    data: story,
  });
};

export const updateStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as UpdateStoryInput;

  const story = await updateStory(userId, storyId, payload);

  return res.status(200).json({
    message: 'Story updated successfully',
    story,
  });
};

export const softdeleteStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const response = await softdeleteStory(userId, storyId);
  if (!response) {
    return res.status(409).json({
      message: 'Story could not be deleted',
    });
  }
  return res.status(200).json({
    message: 'Story deleted successfully',
    data: { deleted: response },
  });
};

export const permanentDeleteStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const response = await permanentDeleteStory(userId, storyId);
  if (!response) {
    return res.status(409).json({
      message: 'Story could not be deleted',
    });
  }
  return res.status(200).json({
    message: 'Story deleted successfully',
    data: { deleted: response },
  });
};

export const restoreStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const story = await restoreStory(userId, storyId);
  return res.status(200).json({
    message: 'Story restored successfully',
    data: story,
  });
};

export const archiveStoryStatusController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const response = await archiveStory(userId, storyId);
  return res.status(200).json({
    message: 'Story archived successfully',
    story: response,
  });
};

export const unarchiveStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const response = await unarchiveStory(userId, storyId);
  return res.status(200).json({
    message: 'Story unarchived successfully',
    ...response,
  });
};

export const rollbackStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  // to be implemented
};
