import { NotFoundError } from '@middleware/error/index.js';
import { Scene, SceneModel } from '@models/Scene.js';
import { ClientSession } from 'mongoose';

export async function validateSceneOwnership(
  userId: string,
  sceneId: string,
  session?: ClientSession
): Promise<Scene> {
  const query = SceneModel.findOne({
    _id: sceneId,
    userId,
  });

  if (session) query.session(session);

  const scene = await query;
  if (!scene) {
    throw new NotFoundError('Scene not found or access denied');
  }
  return scene;
}

export async function validateStorySceneOwnership(
  userId: string,
  sceneId: string,
  storyId: string,
  session?: ClientSession
): Promise<Scene> {
  const query = SceneModel.findOne({
    _id: sceneId,
    userId,
    storyId,
  });

  if (session) query.session(session);

  const scene = await query;
  if (!scene) {
    throw new NotFoundError('Scene not found or access denied');
  }
  return scene;
}
