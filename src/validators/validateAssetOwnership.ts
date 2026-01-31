import { NotFoundError } from '@middleware/error/index.js';
import { SceneAsset, SceneAssetModel } from '@models/SceneAssets.js';
import { ClientSession } from 'mongoose';

export async function validateAssetOwnership(
  userId: string,
  assetId: string,
  session?: ClientSession
): Promise<SceneAsset> {
  const query = SceneAssetModel.findOne({
    _id: assetId,
    userId,
  });

  if (session) query.session(session);

  const asset = await query;
  if (!asset) {
    throw new NotFoundError('Asset not found or access denied');
  }
  return asset;
}
