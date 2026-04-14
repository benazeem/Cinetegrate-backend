import { Request, Response } from 'express';
import {
  getActiveNarration,
  getNarrationById,
  getAllNarrationsForStory,
  generateNarration,
  regenerateNarration,
  createNarrationFromJSON,
  uploadNarrationJSONFromFile,
  updateNarration,
  softDeleteNarration,
  restoreNarration,
  switchActiveNarration,
  getAllDeletedNarrations,
  createEmptyNarration,
} from './narration.service.js';
import {
  RegenerateNarrationInput,
  UploadNarrationJSONInput,
  UpdateNarrationSegmentsInput,
} from '@validation/narration.schema.js';
import { paginationResponse } from '@utils/paginationResponse.js';
import { sendSuccess, sendPaginated } from '@shared/response.js';
import { BadRequestError, NotFoundError } from '@middleware/error/index.js';

export const getAllNarrationsForStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const narrations = await getAllNarrationsForStory(userId, storyId);
  return sendSuccess(res, narrations, 'Narrations retrieved successfully');
};

export const getAllDeletedNarrationsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;
  const [narrations, total] = await getAllDeletedNarrations(userId, storyId, pagination, sorting);
  return sendPaginated(res, narrations as any[], paginationResponse(pagination, total as number), 'Deleted narrations retrieved successfully');
};

export const getActiveNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const narration = await getActiveNarration(userId, storyId);
  if (!narration) {
    throw new NotFoundError('No active narration found for this story');
  }
  return sendSuccess(res, narration, 'Active narration retrieved successfully');
};

export const getNarrationByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const narration = await getNarrationById(userId, narrationId);
  if (!narration) {
    throw new NotFoundError('Narration not found');
  }
  return sendSuccess(res, narration, 'Narration retrieved successfully');
};

export const generateNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const narration = await generateNarration(userId, storyId);
  return sendSuccess(res, narration, 'Narration generated successfully', 201);
};

export const regenerateNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const { extraPrompt } = req.validatedBody as RegenerateNarrationInput;
  const narration = await regenerateNarration(userId, storyId, extraPrompt);
  return sendSuccess(res, narration, 'Narration regenerated successfully', 201);
};

export const createEmptyNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const narration = await createEmptyNarration(userId, storyId);
  return sendSuccess(res, narration, 'Empty narration created successfully', 201);
};

export const uploadNarrationJSONController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const payload = req.validatedBody as UploadNarrationJSONInput;
  const narration = await createNarrationFromJSON(userId, storyId, payload.narrationSegments);
  return sendSuccess(res, narration, 'Narration uploaded successfully', 201);
};

export const uploadNarrationFileController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;

  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }

  const narration = await uploadNarrationJSONFromFile(userId, storyId, req.file.path);
  return sendSuccess(res, narration, 'Narration file uploaded successfully', 201);
};

export const updateNarrationSegmentsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId, narrationId } = req.params;
  const payload = req.validatedBody as UpdateNarrationSegmentsInput;
  const narration = await updateNarration(userId, storyId, narrationId, payload.narrationSegments);
  if (!narration) {
    throw new NotFoundError('Narration not found');
  }
  return sendSuccess(res, narration, 'Narration updated successfully');
};

export const deleteNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  await softDeleteNarration(userId, narrationId);
  return sendSuccess(res, null, 'Narration deleted successfully');
};

export const restoreNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const narration = await restoreNarration(userId, narrationId);
  return sendSuccess(res, narration, 'Narration restored successfully');
};

export const switchActiveNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;
  const narration = await switchActiveNarration(userId, narrationId);
  return sendSuccess(res, narration, 'Active narration switched successfully');
};
