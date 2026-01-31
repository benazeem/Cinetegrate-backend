import { Request, Response } from 'express';
import {
  createScene,
  getSceneById,
  getAllScenesForStory,
  updateScene,
  softDeleteScene,
  permanentDeleteScene,
  restoreScene,
  bulkReorder,
  generateSceneWithAI,
  regenerateScene,
  generateAllScenes,
  regenerateAllScenes,
  moveSceneByOne,
  getSceneCount,
  softdeleteAllScenes,
  restoreAllDeletedScenes,
  permanentDeleteAllScenes,
  bulkRestoreScenes,
  bulkSoftdeleteScenes,
  bulkPermanentDeleteScenes,
  updateSceneDuration,
  getAllDeletedScenes,
  reactivateScene,
  getAllInactiveScenesForStory,
  deactivateScene,
} from './scenes.service.js';
import type {
  CreateSceneInput,
  UpdateSceneInput,
  MoveSceneInput,
  BulkReorderInput,
  GenerateSceneInput,
  RegenerateSceneInput,
  GenerateAllScenesInput,
  BulkRestoreInput,
  DurationInput,
} from '@validation/scenes.schema.js';

// All SCENES CONTROLLERS
export const getAllStoryScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const scenes = await getAllScenesForStory(userId, storyId);

  res.status(200).json({
    message: 'Scenes retrieved successfully',
    data: scenes,
  });
};

export const getAllInactiveStoryScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await getAllInactiveScenesForStory(userId, storyId);
  res.status(200).json({
    message: 'Inactive scenes retrieved successfully',
    data: scenes,
  });
};

export const getAllDeletedScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const scenes = await getAllDeletedScenes(userId, storyId);

  res.status(200).json({
    message: 'Scenes retrieved successfully',
    data: scenes,
  });
};

export const softDeleteAllScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await softdeleteAllScenes(userId, storyId);
  res.status(200).json({
    message: 'All scenes soft deleted successfully',
    data: scenes,
  });
};

export const permanentDeleteAllScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const deletedCount = await permanentDeleteAllScenes(userId, storyId);
  res.status(200).json({
    message: 'All deleted scenes permanently deleted successfully',
    data: { deletedCount },
  });
};

export const restoreAllDeletedScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await restoreAllDeletedScenes(userId, storyId);
  res.status(200).json({
    message: 'All deleted scenes restored successfully',
    data: scenes,
  });
};

export const generateScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { total } = req.validatedBody as GenerateAllScenesInput;

  const scenes = await generateAllScenes(userId, storyId, total);

  res.status(200).json({
    message: 'Scenes generated successfully',
    data: scenes,
  });
};

export const regenerateScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { extraPrompt } = (req.validatedBody as RegenerateSceneInput) || {};

  const scenes = await regenerateAllScenes(userId, storyId, extraPrompt);

  res.status(200).json({
    message: 'Scenes regenerated successfully',
    data: scenes,
  });
};

// BULK SCENES CONTROLLERS

export const bulkReorderController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as BulkReorderInput;

  const scenes = await bulkReorder(userId, storyId, payload);

  res.status(200).json({
    message: 'Scenes reordered successfully',
    data: scenes,
  });
};

export const bulkRestoreScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { sceneIds } = req.validatedBody as BulkRestoreInput;
  const restoredScenes = await bulkRestoreScenes(userId, storyId, sceneIds);
  res.status(200).json({
    message: 'Scenes restored successfully',
    data: restoredScenes,
  });
};

export const bulkSoftDeleteScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { sceneIds } = req.validatedBody as BulkRestoreInput;
  const deletedScenes = await bulkSoftdeleteScenes(userId, storyId, sceneIds);
  res.status(200).json({
    message: 'Scenes soft deleted successfully',
    data: deletedScenes,
  });
};

export const bulkPermanentDeleteScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { sceneIds } = req.validatedBody as BulkRestoreInput;
  const deletedCount = await bulkPermanentDeleteScenes(userId, storyId, sceneIds);
  res.status(200).json({
    message: 'Scenes permanently deleted successfully',
    data: { deletedCount },
  });
};

// SINGLE SCENE CONTROLLERS

export const getSceneByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId, sceneId } = req.params;

  const scene = await getSceneById(userId, storyId, sceneId);

  res.status(200).json({
    message: 'Scene retrieved successfully',
    data: scene,
  });
};

export const createSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as CreateSceneInput;

  const scene = await createScene(userId, storyId, payload, payload.position);

  res.status(201).json({
    message: 'Scene created successfully',
    data: scene,
  });
};

export const generateSingleSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as GenerateSceneInput;

  const scene = await generateSceneWithAI(userId, storyId, payload);

  res.status(201).json({
    message: 'Scene generated successfully',
    data: scene,
  });
};

export const regenerateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const payload = req.validatedBody as RegenerateSceneInput;

  const scene = await regenerateScene(userId, sceneId, payload);

  res.status(200).json({
    message: 'Scene regenerated successfully',
    data: scene,
  });
};

export const updateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const payload = req.validatedBody as UpdateSceneInput;

  const scene = await updateScene(userId, sceneId, payload);

  res.status(200).json({
    message: 'Scene updated successfully',
    data: scene,
  });
};

export const updateSceneDurationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const storyId = req.params.storyId;
  const { duration } = req.validatedBody as DurationInput;
  const scene = await updateSceneDuration(userId, storyId, sceneId, duration);
  res.status(200).json({
    message: 'Scene duration updated successfully',
    data: scene,
  });
};

export const softDeleteSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;

  const deleted = await softDeleteScene(userId, sceneId);

  res.status(200).json({
    message: 'Scene deleted successfully',
    data: { deleted },
  });
};

export const permanentDeleteSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const deleted = await permanentDeleteScene(userId, sceneId);
  res.status(200).json({
    message: 'Scene permanently deleted successfully',
    data: { deleted },
  });
};

export const restoreSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;

  const scene = await restoreScene(userId, sceneId);

  res.status(200).json({
    message: 'Scene restored successfully',
    data: scene,
  });
};

export const reactivateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const scene = await reactivateScene(userId, sceneId);
  res.status(200).json({
    message: 'Scene reactivated successfully',
    data: scene,
  });
};

export const deactivateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const scene = await deactivateScene(userId, sceneId);
  res.status(200).json({
    message: 'Scene deactivated successfully',
    data: scene,
  });
};

export const moveSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const { direction } = req.validatedBody as MoveSceneInput;

  const scene = await moveSceneByOne(userId, sceneId, direction);

  res.status(200).json({
    message: 'Scene moved successfully',
    data: scene,
  });
};

export const getSceneCountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  const count = await getSceneCount(userId, storyId);

  res.status(200).json({
    message: 'Scene count retrieved successfully',
    data: { count },
  });
};
