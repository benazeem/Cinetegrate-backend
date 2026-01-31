import fs from 'fs/promises';
import { SceneAssetModel, SceneAsset } from '@models/SceneAssets.js';
import { SceneModel } from '@models/Scene.js';
import { NotFoundError, BadRequestError, ConflictError } from '@middleware/error/index.js';
import mongoose, { ClientSession } from 'mongoose';
import type { Pagination, Sorting } from 'types/Pagination.js';
import { getVideoDuration } from '@utils/getVideoDuration.js';
import { assertFeaturePermission } from '@modules/featurePermission/featurePermission.service.js';
import { getCreditCost } from '@utils/getCreditCost.js';
import { consumeCredits } from '@modules/credit/credit.service.js';
import { validateSceneOwnership } from 'validators/validateSceneOwnership.js';
import { validateAssetOwnership } from 'validators/validateAssetOwnership.js';
import { validateUser } from 'validators/validateUser.js';
import {
  assertAssetIsDeleted,
  assertAssetNotDeleted,
  assertHasDeletedAssets,
  assertHasNonDeletedAssets,
} from 'domain/assertions/assertAssetState.js';
import { withTransaction } from '@db/withTransaction.js';

// Get the next version number for an asset in a scene
async function getNextVersionNumber(sceneId: string, session?: ClientSession): Promise<number> {
  const query = SceneAssetModel.findOne({ sceneId }).sort({ version: -1 }).select('version');

  if (session) query.session(session);

  const lastAsset = await query;
  return lastAsset ? lastAsset.version + 1 : 1;
}

// All Op services
export async function getAllAssetsForScene(
  userId: string,
  sceneId: string,
  pagination: Pagination,
  sorting: Sorting
): Promise<[SceneAsset[], number]> {
  const { page, limit, skip } = pagination;
  const { sortBy, sortOrder } = sorting;
  const [assets, total] = await Promise.all([
    SceneAssetModel.find({
      sceneId,
      userId,
      deletedAt: { $exists: false },
    })
      .sort(sortBy ? { [sortBy]: sortOrder } : { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SceneAssetModel.countDocuments({
      sceneId,
      userId,
      deletedAt: { $exists: false },
    }),
  ]);
  return [assets, total];
}

export async function getAllDeletedAssets(
  userId: string,
  sceneId: string,
  pagination: Pagination,
  sorting: Sorting
): Promise<[SceneAsset[], number]> {
  const { page, limit, skip } = pagination;
  const { sortBy, sortOrder } = sorting;
  const [assets, total] = await Promise.all([
    SceneAssetModel.find({
      sceneId,
      userId,
      deletedAt: { $exists: true },
    })
      .sort(sortBy ? { [sortBy]: sortOrder } : { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SceneAssetModel.countDocuments({
      sceneId,
      userId,
      deletedAt: { $exists: true },
    }),
  ]);
  return [assets, total];
}

export async function restoreAllDeletedAssets(
  userId: string,
  sceneId: string
): Promise<{ restoredCount: number }> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);

    const assetsToRestore = await SceneAssetModel.find({
      userId,
      sceneId,
      deletedAt: { $exists: true },
    }).session(session);
    assertHasDeletedAssets(assetsToRestore);

    const bulkOps = assetsToRestore.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $unset: { deletedAt: 1 } },
      },
    }));
    const result = await SceneAssetModel.bulkWrite(bulkOps, { session });

    return { restoredCount: result.modifiedCount };
  });
}

export async function softDeleteAllAssetsForScene(
  userId: string,
  sceneId: string
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);

    const assetsToDelete = await SceneAssetModel.find({
      userId,
      sceneId,
      deletedAt: { $exists: false },
    }).session(session);

    assertHasNonDeletedAssets(assetsToDelete);

    const scenes = await SceneModel.find({
      activeAssetId: { $in: assetsToDelete.map((a) => a._id) },
    }).session(session);
    if (scenes.length > 0) {
      throw new BadRequestError(
        `Cannot delete an active asset. Please unset it as active from ${scenes.map((s) => s._id).join(', ')} before deletion or Force delete instead.`
      );
    }

    const bulkOps = assetsToDelete.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $set: { deletedAt: new Date() } },
      },
    }));

    const result = await SceneAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: result.modifiedCount };
  });
}

export async function permanentDeleteAllAssetsForScene(
  userId: string,
  sceneId: string
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);

    const assetsToDelete = await SceneAssetModel.find({
      userId,
      sceneId,
      deletedAt: { $exists: true },
    }).session(session);

    assertHasDeletedAssets(assetsToDelete);

    const bulkOps = assetsToDelete.map((asset) => ({
      deleteOne: { filter: { _id: asset._id } },
    }));

    const result = await SceneAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: result.deletedCount || 0 };
  });
}

export async function getAssetCount(userId: string, sceneId: string): Promise<number> {
  await validateSceneOwnership(userId, sceneId);

  const count = await SceneAssetModel.countDocuments({
    sceneId,
    userId,
    deletedAt: { $exists: false },
  });

  return count;
}

//  Bulk Op services
export async function softBulkDeleteAssets(
  userId: string,
  sceneId: string,
  assetIds: string[]
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);

    const assets = await SceneAssetModel.find({
      _id: { $in: assetIds },
      userId,
      sceneId,
      deletedAt: { $exists: false },
    }).session(session);

    if (assets.length !== assetIds.length) {
      throw new BadRequestError('Some assets were not found or already deleted');
    }

    const scenes = await SceneModel.find({
      activeAssetId: { $in: assetIds },
    }).session(session);
    if (scenes.length > 0) {
      throw new BadRequestError(
        `Cannot delete an active asset. Please unset it as active from ${scenes.map((s) => s._id).join(', ')} before deletion or Force delete instead.`
      );
    }

    const bulkOps = assets.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $set: { deletedAt: new Date() } },
      },
    }));

    await SceneAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: assets.length };
  });
}

export async function permanentBulkDeleteAssets(
  userId: string,
  sceneId: string,
  assetIds: string[]
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);

    const assets = await SceneAssetModel.find({
      _id: { $in: assetIds },
      userId,
      sceneId,
      deletedAt: { $exists: true },
    }).session(session);

    if (assets.length !== assetIds.length) {
      throw new BadRequestError('Some assets were not found');
    }

    const bulkOps = assets.map((asset) => ({
      deleteOne: { filter: { _id: asset._id } },
    }));

    await SceneAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: assets.length };
  });
}

export async function bulkRestoreAssets(
  userId: string,
  sceneId: string,
  assetIds: string[]
): Promise<SceneAsset[]> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);

    const assets = await SceneAssetModel.find({
      _id: { $in: assetIds },
      userId,
      sceneId,
      deletedAt: { $exists: true },
    }).session(session);

    if (assets.length !== assetIds.length) {
      throw new BadRequestError('Some assets were not found or not deleted');
    }

    const bulkOps = assets.map((asset, index) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: {
          $unset: { deletedAt: 1 },
        },
      },
    }));
    await SceneAssetModel.bulkWrite(bulkOps, { session });

    const restoredAssets = await SceneAssetModel.find({
      _id: { $in: assetIds },
      userId,
    })
      .sort({ order: 1 })
      .lean()
      .session(session);
    await session.commitTransaction();
    return restoredAssets;
  });
}

// Single Op services
export async function getAssetById(userId: string, assetId: string): Promise<SceneAsset> {
  const asset = await validateAssetOwnership(userId, assetId);
  return asset;
}

export async function getActiveAssetForScene(userId: string, sceneId: string): Promise<SceneAsset | null> {
  const scene = await validateSceneOwnership(userId, sceneId);

  if (!scene.activeAssetId) {
    return null;
  }

  const asset = await SceneAssetModel.findOne({
    _id: scene.activeAssetId,
    userId,
    deletedAt: { $exists: false },
  });

  if (!asset) {
    throw new ConflictError('The Asset does not exists');
  }

  return asset;
}

export async function generateVideoAsset(
  userId: string,
  sceneId: string,
  grade?: number
): Promise<SceneAsset> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const scene = await validateSceneOwnership(userId, sceneId, session);
    const user = await validateUser(userId, session);

    if (user.planEndsAt && user.planEndsAt <= new Date()) {
      throw new BadRequestError('Plan has expired. Please renew to generate new assets.');
    }

    // wait and check plan permissions
    await assertFeaturePermission({
      userId: user._id,
      action: 'VIDEO_GEN',
      grade: grade || 1,
    });

    // Deduct credits if applicable
    if (grade && grade > 1) {
      const creditsUsed = await getCreditCost('VIDEO_GEN', grade);
      await consumeCredits(user._id, creditsUsed, session);
    }

    // Placeholder logic for video generation
    const generatedVideoUrl = `/generated/videos/${sceneId}-${Date.now()}.mp4`;
    const asset = new SceneAssetModel({
      userId,
      sceneId,
      type: 'video',
      url: generatedVideoUrl,
      visibility: 'public',
      generationSource: 'ai',
      version: await getNextVersionNumber(sceneId),
    });
    await asset.save();
    return asset;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function generateImageAsset(userId: string, sceneId: string): Promise<SceneAsset> {
  const scene = await validateSceneOwnership(userId, sceneId);
  // Placeholder logic for image generation
}

export async function uploadVideoAsset(
  userId: string,
  sceneId: string,
  file: Express.Multer.File
): Promise<{ asset: SceneAsset; videoUrl: string }> {
  const scene = await validateSceneOwnership(userId, sceneId);
  let duration: number;

  try {
    duration = await getVideoDuration(file.path);
  } catch {
    await fs.unlink(file.path);
    throw new BadRequestError('Invalid or corrupted video file');
  }

  console.log('Video duration:', duration, 'Scene duration:', scene.duration);
  console.log('Difference:', Math.abs(duration - (scene.duration || 0)));

  if (scene.duration !== undefined && Math.abs(duration - scene.duration) > 0.25) {
    await fs.unlink(file.path);
    throw new BadRequestError('Video duration does not match existing scene duration and cannot be uploaded');
  }
  // TODO: Add video to cloud storage here and get the URL
  const videoUrl = `/uploads/videos/${file.filename}`;
  const asset = new SceneAssetModel({
    userId,
    sceneId,
    type: 'video',
    url: videoUrl,
    visibility: 'public',
    format: file.mimetype.split('/')[1] || undefined,
    version: await getNextVersionNumber(sceneId),
    duration,
  });
  await asset.save();

  await fs.unlink(file.path);

  return { asset, videoUrl };
}

export async function uploadImageAsset(
  userId: string,
  sceneId: string,
  file: Express.Multer.File
): Promise<SceneAsset> {
  await validateSceneOwnership(userId, sceneId);
  //TODO: Add Image to cloud storage and get URL
  const imageUrl = `/uploads/images/${file.filename}`;
  const asset = new SceneAssetModel({
    userId,
    sceneId,
    type: 'image',
    url: imageUrl,
    visibility: 'public',
    format: file.mimetype.split('/')[1] || undefined,
    version: await getNextVersionNumber(sceneId),
  });
  await asset.save();

  await fs.unlink(file.path);

  return asset;
}

export async function setActiveAsset(userId: string, sceneId: string, assetId: string): Promise<SceneAsset> {
  return withTransaction(async (session) => {
    await validateSceneOwnership(userId, sceneId, session);
    const asset = await validateAssetOwnership(userId, assetId, session);
    assertAssetNotDeleted(asset);

    await SceneModel.findByIdAndUpdate(sceneId, { activeAssetId: assetId }, { session });

    return asset;
  });
}

export async function softDeleteAsset(userId: string, assetId: string): Promise<void> {
  return withTransaction(async (session) => {
    const asset = await validateAssetOwnership(userId, assetId, session);
    assertAssetNotDeleted(asset);

    const activeAssetScenes = await SceneModel.find({
      activeAssetId: assetId,
    }).session(session);

    if (activeAssetScenes.length > 0) {
      throw new BadRequestError(
        `Cannot delete an active asset. Please unset it as active from ${activeAssetScenes.map((scene) => scene._id).join(', ')} before deletion.`
      );
    }

    await SceneAssetModel.findByIdAndUpdate(assetId, { deletedAt: new Date() }, { new: true, session });

    await session.commitTransaction();
    return;
  });
}

export async function forceDeleteActiveAsset(userId: string, assetId: string): Promise<void> {
  const asset = await validateAssetOwnership(userId, assetId);
  const scene = await validateSceneOwnership(userId, asset.sceneId.toString());
  assertAssetNotDeleted(asset);

  if (scene.activeAssetId && scene.activeAssetId.equals(asset._id)) {
    await SceneModel.findByIdAndUpdate(
      asset.sceneId,
      {
        $unset: { activeAssetId: 1 },
      },
      { runValidators: true }
    );
  }
  await SceneAssetModel.findByIdAndUpdate(assetId, { deletedAt: new Date() }, { new: true });
  return;
}

export async function permanentDeleteAsset(userId: string, assetId: string): Promise<SceneAsset | null> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const asset = await validateAssetOwnership(userId, assetId, session);
    assertAssetNotDeleted(asset);
    const activeAssetScenes = await SceneModel.find({
      activeAssetId: assetId,
    }).session(session);
    for (const scene of activeAssetScenes) {
      await SceneModel.findByIdAndUpdate(scene._id, { $unset: { activeAssetId: 1 } }, { session });
    }
    const deletedAsset = await SceneAssetModel.findByIdAndUpdate(
      assetId,
      { deletedAt: new Date() },
      { new: true, session }
    );
    await session.commitTransaction();
    return deletedAsset!;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function restoreAsset(userId: string, assetId: string): Promise<SceneAsset> {
  const asset = await validateAssetOwnership(userId, assetId);
  assertAssetIsDeleted(asset);

  const restoredAsset = await SceneAssetModel.findByIdAndUpdate(
    assetId,
    { $unset: { deletedAt: 1 } },
    { new: true }
  );

  if (!restoredAsset) {
    throw new NotFoundError('Asset not found');
  }

  return restoredAsset;
}
