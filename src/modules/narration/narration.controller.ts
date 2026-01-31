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

export const getAllNarrationsForStoryController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;

  const [narrations, total] = await getAllNarrationsForStory(userId, storyId, pagination, sorting);
  const paginationRes = paginationResponse(pagination, total as number);

  return res.status(200).json({
    data: narrations,
    pagination: paginationRes,
  });
};

export const getAllDeletedNarrationsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const pagination = req?.pagination!;
  const sorting = req?.sorting!;

  const [narrations, total] = await getAllDeletedNarrations(userId, storyId, pagination, sorting);

  const paginationRes = paginationResponse(pagination, total as number);

  return res.status(200).json({
    data: narrations,
    pagination: paginationRes,
  });
};

// Single narration controllers

export const getActiveNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;

  const narration = await getActiveNarration(userId, storyId);

  if (!narration) {
    return res.status(404).json({
      message: 'No active narration found for this story',
    });
  }

  return res.status(200).json({
    narration,
  });
};

export const getNarrationByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;

  const narration = await getNarrationById(userId, narrationId);

  if (!narration) {
    return res.status(404).json({
      message: 'Narration not found',
    });
  }

  return res.status(200).json({
    narration,
  });
};

export const generateNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;

  const narration = await generateNarration(userId, storyId);

  return res.status(201).json({
    message: 'Narration generated successfully',
    narration,
  });
};

export const regenerateNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const { extraPrompt } = req.validatedBody as RegenerateNarrationInput;

  const narration = await regenerateNarration(userId, storyId, extraPrompt);

  return res.status(201).json({
    message: 'Narration regenerated successfully',
    narration,
  });
};

export const createEmptyNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const narration = await createEmptyNarration(userId, storyId);
  return res.status(201).json({
    message: 'Empty narration created successfully',
    narration,
  });
};

export const uploadNarrationJSONController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;
  const payload = req.validatedBody as UploadNarrationJSONInput;

  const narration = await createNarrationFromJSON(userId, storyId, payload.narrationSegments);

  return res.status(201).json({
    message: 'Narration uploaded successfully',
    narration,
  });
};

export const uploadNarrationFileController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
    });
  }

  const narration = await uploadNarrationJSONFromFile(userId, storyId, req.file.path);

  return res.status(201).json({
    message: 'Narration file uploaded successfully',
    narration,
  });
};

export const updateNarrationSegmentsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId, narrationId } = req.params;
  const payload = req.validatedBody as UpdateNarrationSegmentsInput;

  const narration = await updateNarration(userId, storyId, narrationId, payload.narrationSegments);

  if (!narration) {
    return res.status(404).json({
      message: 'Narration not found',
    });
  }

  return res.status(200).json({
    message: 'Narration updated successfully',
    narration,
  });
};

export const deleteNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;

  const narration = await softDeleteNarration(userId, narrationId);

  return res.status(200).json({
    message: 'Narration deleted successfully',
  });
};

export const restoreNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;

  const narration = await restoreNarration(userId, narrationId);

  return res.status(200).json({
    message: 'Narration restored successfully',
    narration,
  });
};

export const switchActiveNarrationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { narrationId } = req.params;

  const narration = await switchActiveNarration(userId, narrationId);

  return res.status(200).json({
    message: 'Active narration switched successfully',
    narration,
  });
};
