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
  createScenesFromJSON,
  uploadScenesJSONFromFile,
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
  UploadScenesJSONInput,
  BulkRestoreInput,
  DurationInput,
} from '@validation/scenes.schema.js';
import { sendSuccess } from '@shared/response.js';
import { BadRequestError } from '@middleware/error/index.js';

// ==================== ALL SCENES CONTROLLERS ====================

export const getAllStoryScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await getAllScenesForStory(userId, storyId);
  return sendSuccess(res, scenes, 'Scenes retrieved successfully');
};

export const getAllInactiveStoryScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await getAllInactiveScenesForStory(userId, storyId);
  return sendSuccess(res, scenes, 'Inactive scenes retrieved successfully');
};

export const getAllDeletedScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await getAllDeletedScenes(userId, storyId);
  return sendSuccess(res, scenes, 'Deleted scenes retrieved successfully');
};

export const softDeleteAllScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await softdeleteAllScenes(userId, storyId);
  return sendSuccess(res, scenes, 'All scenes soft deleted successfully');
};

export const permanentDeleteAllScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const deletedCount = await permanentDeleteAllScenes(userId, storyId);
  return sendSuccess(res, { deletedCount }, 'All deleted scenes permanently deleted successfully');
};

export const restoreAllDeletedScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const scenes = await restoreAllDeletedScenes(userId, storyId);
  return sendSuccess(res, scenes, 'All deleted scenes restored successfully');
};

export const generateScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { total } = req.validatedBody as GenerateAllScenesInput;
  const scenes = await generateAllScenes(userId, storyId, total);
  return sendSuccess(res, scenes, 'Scenes generated successfully');
};

export const regenerateScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { extraPrompt } = (req.validatedBody as RegenerateSceneInput) || {};
  const scenes = await regenerateAllScenes(userId, storyId, extraPrompt);
  return sendSuccess(res, scenes, 'Scenes regenerated successfully');
};

export const uploadScenesJSONController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as UploadScenesJSONInput;
  const scenes = await createScenesFromJSON(userId, storyId, payload.scenes);
  return sendSuccess(res, scenes, 'Scenes uploaded successfully', 201);
};

export const uploadScenesFileController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;

  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }

  const fileSource = req.file.buffer ?? req.file.path;
  if (!fileSource) {
    throw new BadRequestError('Invalid uploaded file payload');
  }

  const scenes = await uploadScenesJSONFromFile(userId, storyId, fileSource);
  return sendSuccess(res, scenes, 'Scenes file uploaded successfully', 201);
};

// ==================== BULK SCENES CONTROLLERS ====================

export const bulkReorderController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as BulkReorderInput;
  const scenes = await bulkReorder(userId, storyId, payload);
  return sendSuccess(res, scenes, 'Scenes reordered successfully');
};

export const bulkRestoreScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { sceneIds } = req.validatedBody as BulkRestoreInput;
  const restoredScenes = await bulkRestoreScenes(userId, storyId, sceneIds);
  return sendSuccess(res, restoredScenes, 'Scenes restored successfully');
};

export const bulkSoftDeleteScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { sceneIds } = req.validatedBody as BulkRestoreInput;
  const deletedScenes = await bulkSoftdeleteScenes(userId, storyId, sceneIds);
  return sendSuccess(res, deletedScenes, 'Scenes soft deleted successfully');
};

export const bulkPermanentDeleteScenesController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const { sceneIds } = req.validatedBody as BulkRestoreInput;
  const deletedCount = await bulkPermanentDeleteScenes(userId, storyId, sceneIds);
  return sendSuccess(res, { deletedCount }, 'Scenes permanently deleted successfully');
};

// ==================== SINGLE SCENE CONTROLLERS ====================

export const getSceneByIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { storyId, sceneId } = req.params;
  const scene = await getSceneById(userId, storyId, sceneId);
  return sendSuccess(res, scene, 'Scene retrieved successfully');
};

export const createSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as CreateSceneInput;
  const scene = await createScene(userId, storyId, payload, payload.position);
  return sendSuccess(res, scene, 'Scene created successfully', 201);
};

export const generateSingleSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const payload = req.validatedBody as GenerateSceneInput;
  const scene = await generateSceneWithAI(userId, storyId, payload);
  return sendSuccess(res, scene, 'Scene generated successfully', 201);
};

export const regenerateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const payload = req.validatedBody as RegenerateSceneInput;
  const scene = await regenerateScene(userId, sceneId, payload);
  return sendSuccess(res, scene, 'Scene regenerated successfully');
};

export const updateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const payload = req.validatedBody as UpdateSceneInput;
  const scene = await updateScene(userId, sceneId, payload);
  return sendSuccess(res, scene, 'Scene updated successfully');
};

export const updateSceneDurationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const storyId = req.params.storyId;
  const { duration } = req.validatedBody as DurationInput;
  const scene = await updateSceneDuration(userId, storyId, sceneId, duration);
  return sendSuccess(res, scene, 'Scene duration updated successfully');
};

export const softDeleteSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const deleted = await softDeleteScene(userId, sceneId);
  return sendSuccess(res, { deleted }, 'Scene deleted successfully');
};

export const permanentDeleteSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const deleted = await permanentDeleteScene(userId, sceneId);
  return sendSuccess(res, { deleted }, 'Scene permanently deleted successfully');
};

export const restoreSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const scene = await restoreScene(userId, sceneId);
  return sendSuccess(res, scene, 'Scene restored successfully');
};

export const reactivateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const scene = await reactivateScene(userId, sceneId);
  return sendSuccess(res, scene, 'Scene reactivated successfully');
};

export const deactivateSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const scene = await deactivateScene(userId, sceneId);
  return sendSuccess(res, scene, 'Scene deactivated successfully');
};

export const moveSceneController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sceneId = req.params.sceneId;
  const { direction } = req.validatedBody as MoveSceneInput;
  const scene = await moveSceneByOne(userId, sceneId, direction);
  return sendSuccess(res, scene, 'Scene moved successfully');
};

export const getSceneCountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const storyId = req.params.storyId;
  const count = await getSceneCount(userId, storyId);
  return sendSuccess(res, { count }, 'Scene count retrieved successfully');
};
