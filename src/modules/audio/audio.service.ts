import { AudioAsset, AudioAssetModel } from '@models/AudioAsset.js';
import { StoryNarrationModel } from '@models/Narration.js';
import { NotFoundError, BadRequestError, ConflictError } from '@middleware/error/index.js';
import { ClientSession } from 'mongoose';
import type { Pagination, Sorting } from '@app-types/Pagination.js';
import { validateNarrationOwnership } from 'validators/validateNarrationOwnership.js';
import { validateAudioAssetOwnership } from 'validators/validateAudioAssetOwnership.js';
import {
  assertAudioAssetIsDeleted,
  assertAudioAssetNotDeleted,
  assertAudioAssetNotActive,
  assertHasDeletedAudioAssets,
  assertHasNonDeletedAudioAssets,
  assertAudioAssetTypeIsNarration,
} from 'domain/assertions/assertAudioAssetState.js';
import { assertNarrationNotDeleted } from 'domain/assertions/assertNarrationState.js';
import { withTransaction } from '@db/withTransaction.js';

// Get the next version number for an audio asset in a narration
async function getNextVersionNumber(narrationId: string, session?: ClientSession): Promise<number> {
  const query = AudioAssetModel.findOne({ narrationId }).sort({ version: -1 }).select('version');

  if (session) query.session(session);

  const lastAsset = await query;
  return lastAsset ? (lastAsset.version || 0) + 1 : 1;
}

// ==================== ALL OPERATIONS ====================

export async function getAllAudioAssetsForNarration(
  userId: string,
  narrationId: string,
  pagination: Pagination,
  sorting: Sorting
): Promise<[AudioAsset[], number]> {
  const { limit, skip } = pagination;
  const { sortBy, sortOrder } = sorting;

  const [audioAssets, total] = await Promise.all([
    AudioAssetModel.find({
      narrationId,
      userId,
      deletedAt: { $exists: false },
    })
      .sort(sortBy ? { [sortBy]: sortOrder } : { version: -1 })
      .skip(skip)
      .limit(limit),
    AudioAssetModel.countDocuments({
      narrationId,
      userId,
      deletedAt: { $exists: false },
    }),
  ]);

  return [audioAssets, total];
}

export async function getAllDeletedAudioAssets(
  userId: string,
  narrationId: string,
  pagination: Pagination,
  sorting: Sorting
): Promise<[AudioAsset[], number]> {
  const { limit, skip } = pagination;
  const { sortBy, sortOrder } = sorting;

  const [audioAssets, total] = await Promise.all([
    AudioAssetModel.find({
      narrationId,
      userId,
      deletedAt: { $exists: true },
    })
      .sort(sortBy ? { [sortBy]: sortOrder } : { deletedAt: -1 })
      .skip(skip)
      .limit(limit),
    AudioAssetModel.countDocuments({
      narrationId,
      userId,
      deletedAt: { $exists: true },
    }),
  ]);

  return [audioAssets, total];
}

export async function restoreAllDeletedAudioAssets(
  userId: string,
  narrationId: string
): Promise<{ restoredCount: number }> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const assetsToRestore = await AudioAssetModel.find({
      userId,
      narrationId,
      deletedAt: { $exists: true },
    }).session(session);

    assertHasDeletedAudioAssets(assetsToRestore);

    const bulkOps = assetsToRestore.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $unset: { deletedAt: 1 } },
      },
    }));

    const result = await AudioAssetModel.bulkWrite(bulkOps, { session });

    return { restoredCount: result.modifiedCount };
  });
}

export async function softDeleteAllAudioAssetsForNarration(
  userId: string,
  narrationId: string
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const assetsToDelete = await AudioAssetModel.find({
      userId,
      narrationId,
      deletedAt: { $exists: false },
    }).session(session);

    assertHasNonDeletedAudioAssets(assetsToDelete);

    const activeAsset = assetsToDelete.find((a) => a.activeNarration);
    if (activeAsset) {
      throw new BadRequestError(
        `Cannot delete the active audio asset. Please set another audio asset as active first or use force delete on the active asset ${activeAsset._id}.`
      );
    }

    const bulkOps = assetsToDelete.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $set: { deletedAt: new Date() } },
      },
    }));

    const result = await AudioAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: result.modifiedCount };
  });
}

export async function permanentDeleteAllAudioAssetsForNarration(
  userId: string,
  narrationId: string
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const assetsToDelete = await AudioAssetModel.find({
      userId,
      narrationId,
      deletedAt: { $exists: true },
    }).session(session);

    assertHasDeletedAudioAssets(assetsToDelete);

    const bulkOps = assetsToDelete.map((asset) => ({
      deleteOne: { filter: { _id: asset._id } },
    }));

    const result = await AudioAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: result.deletedCount || 0 };
  });
}

export async function getAudioAssetCount(userId: string, narrationId: string): Promise<number> {
  await validateNarrationOwnership(userId, narrationId);

  const count = await AudioAssetModel.countDocuments({
    narrationId,
    userId,
    deletedAt: { $exists: false },
  });

  return count;
}

// ==================== BULK OPERATIONS ====================

export async function softBulkDeleteAudioAssets(
  userId: string,
  narrationId: string,
  audioAssetIds: string[]
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const assets = await AudioAssetModel.find({
      _id: { $in: audioAssetIds },
      userId,
      narrationId,
      deletedAt: { $exists: false },
    }).session(session);

    if (assets.length !== audioAssetIds.length) {
      throw new BadRequestError('Some audio assets were not found or already deleted');
    }

    // Check if any asset is the active one
    const activeAsset = assets.find((a) => a.activeNarration);
    if (activeAsset) {
      throw new BadRequestError(
        `Cannot delete the active audio asset. Please set another audio asset as active first or use force delete on the active asset ${activeAsset._id}.`
      );
    }

    const bulkOps = assets.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $set: { deletedAt: new Date() } },
      },
    }));

    await AudioAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: assets.length };
  });
}

export async function permanentBulkDeleteAudioAssets(
  userId: string,
  narrationId: string,
  audioAssetIds: string[]
): Promise<{ deletedCount: number }> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const assets = await AudioAssetModel.find({
      _id: { $in: audioAssetIds },
      userId,
      narrationId,
      deletedAt: { $exists: true },
    }).session(session);

    if (assets.length !== audioAssetIds.length) {
      throw new BadRequestError('Some audio assets were not found');
    }

    const bulkOps = assets.map((asset) => ({
      deleteOne: { filter: { _id: asset._id } },
    }));

    await AudioAssetModel.bulkWrite(bulkOps, { session });

    return { deletedCount: assets.length };
  });
}

export async function bulkRestoreAudioAssets(
  userId: string,
  narrationId: string,
  audioAssetIds: string[]
): Promise<AudioAsset[]> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const assets = await AudioAssetModel.find({
      _id: { $in: audioAssetIds },
      userId,
      narrationId,
      deletedAt: { $exists: true },
    }).session(session);

    if (assets.length !== audioAssetIds.length) {
      throw new BadRequestError('Some audio assets were not found or not deleted');
    }

    const bulkOps = assets.map((asset) => ({
      updateOne: {
        filter: { _id: asset._id },
        update: { $unset: { deletedAt: 1 } },
      },
    }));

    await AudioAssetModel.bulkWrite(bulkOps, { session });

    const restoredAssets = await AudioAssetModel.find({
      _id: { $in: audioAssetIds },
      userId,
    })
      .sort({ version: -1 })
      .lean()
      .session(session);

    return restoredAssets;
  });
}

// ==================== SINGLE OPERATIONS ====================

export async function getAudioAssetById(userId: string, audioAssetId: string): Promise<AudioAsset> {
  const audioAsset = await validateAudioAssetOwnership(userId, audioAssetId);
  return audioAsset;
}

export async function getActiveAudioAssetForNarration(
  userId: string,
  narrationId: string
): Promise<AudioAsset | null> {
  const audioAsset = await AudioAssetModel.findOne({
    narrationId,
    userId,
    activeNarration: true,
    deletedAt: { $exists: false },
  });

  return audioAsset;
}

export async function generateAudioAsset(
  userId: string,
  narrationId: string,
  voiceId: string,
  prompt?: string
): Promise<AudioAsset> {
  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);
    assertNarrationNotDeleted(narration);

    const version = await getNextVersionNumber(narrationId, session);

    // TODO: Integrate with actual AI TTS service (ElevenLabs, OpenAI, etc.)
    // For now, we create a placeholder that should be replaced with actual generation
    const generatedUrl = `https://placeholder-audio-url.com/${narrationId}/${version}`;
    const estimatedDuration = narration.totalDuration || 60;

    // Deactivate current active audio asset
    await AudioAssetModel.updateMany(
      { narrationId, activeNarration: true },
      { $set: { activeNarration: false } },
      { session }
    );

    const [audioAsset] = await AudioAssetModel.create(
      [
        {
          userId,
          narrationId,
          activeNarration: true,
          type: 'narration',
          url: generatedUrl,
          prompt,
          generationSource: 'ai',
          voiceId,
          duration: estimatedDuration,
          version,
        },
      ],
      { session }
    );

    await StoryNarrationModel.findByIdAndUpdate(
      narrationId,
      { activeAudioAssetId: audioAsset._id },
      { session }
    );

    return audioAsset;
  });
}

export async function regenerateAudioAsset(
  userId: string,
  audioAssetId: string,
  voiceId?: string,
  extraPrompt?: string
): Promise<AudioAsset> {
  return withTransaction(async (session) => {
    const existingAsset = await validateAudioAssetOwnership(userId, audioAssetId, session);
    assertAudioAssetNotDeleted(existingAsset);
    assertAudioAssetTypeIsNarration(existingAsset);

    if (!existingAsset.narrationId) {
      throw new BadRequestError('Audio asset is not linked to a narration');
    }

    const narration = await validateNarrationOwnership(userId, existingAsset.narrationId.toString(), session);
    assertNarrationNotDeleted(narration);

    const version = await getNextVersionNumber(existingAsset.narrationId.toString(), session);

    const finalVoiceId = voiceId || existingAsset.voiceId;
    if (!finalVoiceId) {
      throw new BadRequestError('Voice ID is required for regeneration');
    }

    const finalPrompt = extraPrompt
      ? `${existingAsset.prompt || ''} ${extraPrompt}`.trim()
      : existingAsset.prompt;

    // TODO: Integrate with actual AI TTS service
    const generatedUrl = `https://placeholder-audio-url.com/${existingAsset.narrationId}/${version}`;

    await AudioAssetModel.updateMany(
      { narrationId: existingAsset.narrationId, activeNarration: true },
      { $set: { activeNarration: false } },
      { session }
    );

    const [audioAsset] = await AudioAssetModel.create(
      [
        {
          userId,
          narrationId: existingAsset.narrationId,
          activeNarration: true,
          type: 'narration',
          url: generatedUrl,
          prompt: finalPrompt,
          generationSource: 'ai',
          voiceId: finalVoiceId,
          duration: existingAsset.duration,
          version,
        },
      ],
      { session }
    );

    await StoryNarrationModel.findByIdAndUpdate(
      existingAsset.narrationId,
      { activeAudioAssetId: audioAsset._id },
      { session }
    );

    return audioAsset;
  });
}

export async function uploadNarrationAudioAsset(
  userId: string,
  narrationId: string,
  filePath: string
): Promise<AudioAsset> {
  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);
    assertNarrationNotDeleted(narration);

    const version = await getNextVersionNumber(narrationId, session);

    // process audio to a standard format  and also
    // get duration and check if duration exceeds narration total duration

    // TODO: Upload file to S3 and get the URL
    const uploadedUrl = filePath; // Replace with actual S3 upload

    await AudioAssetModel.updateMany(
      { narrationId, activeNarration: true },
      { $set: { activeNarration: false } },
      { session }
    );

    const [audioAsset] = await AudioAssetModel.create(
      [
        {
          userId,
          narrationId,
          activeNarration: true,
          type: 'narration',
          url: uploadedUrl,
          generationSource: 'user',
          duration: narration.totalDuration || 60,
          version,
        },
      ],
      { session }
    );

    await StoryNarrationModel.findByIdAndUpdate(
      narrationId,
      { activeAudioAssetId: audioAsset._id },
      { session }
    );

    return audioAsset;
  });
}

export async function setActiveAudioAsset(
  userId: string,
  narrationId: string,
  audioAssetId: string
): Promise<AudioAsset> {
  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);
    assertNarrationNotDeleted(narration);

    const audioAsset = await validateAudioAssetOwnership(userId, audioAssetId, session);
    assertAudioAssetNotDeleted(audioAsset);
    assertAudioAssetTypeIsNarration(audioAsset);

    if (audioAsset.narrationId?.toString() !== narrationId) {
      throw new BadRequestError('Audio asset does not belong to this narration');
    }

    if (audioAsset.activeNarration) {
      throw new ConflictError('Audio asset is already the active narration');
    }

    await AudioAssetModel.updateMany(
      { narrationId, activeNarration: true },
      { $set: { activeNarration: false } },
      { session }
    );

    const updatedAsset = await AudioAssetModel.findByIdAndUpdate(
      audioAssetId,
      { activeNarration: true },
      { new: true, session }
    );

    await StoryNarrationModel.findByIdAndUpdate(
      narrationId,
      { activeAudioAssetId: audioAssetId },
      { session }
    );

    return updatedAsset as AudioAsset;
  });
}

export async function softDeleteAudioAsset(userId: string, audioAssetId: string): Promise<void> {
  return withTransaction(async (session) => {
    const audioAsset = await validateAudioAssetOwnership(userId, audioAssetId, session);
    assertAudioAssetNotDeleted(audioAsset);
    assertAudioAssetNotActive(audioAsset);

    await AudioAssetModel.findByIdAndUpdate(audioAssetId, { deletedAt: new Date() }, { session });
  });
}

export async function permanentDeleteAudioAsset(userId: string, audioAssetId: string): Promise<void> {
  return withTransaction(async (session) => {
    const audioAsset = await validateAudioAssetOwnership(userId, audioAssetId, session);
    assertAudioAssetIsDeleted(audioAsset);

    await AudioAssetModel.findByIdAndDelete(audioAssetId, { session });

    // TODO: Delete file from S3
  });
}

export async function forceDeleteActiveAudioAsset(userId: string, audioAssetId: string): Promise<void> {
  return withTransaction(async (session) => {
    const audioAsset = await validateAudioAssetOwnership(userId, audioAssetId, session);
    assertAudioAssetNotDeleted(audioAsset);

    if (audioAsset.activeNarration && audioAsset.narrationId) {
      const nextActiveAsset = await AudioAssetModel.findOne({
        narrationId: audioAsset.narrationId,
        _id: { $ne: audioAssetId },
        type: 'narration',
        deletedAt: { $exists: false },
      })
        .sort({ version: -1 })
        .session(session);

      if (nextActiveAsset) {
        await AudioAssetModel.findByIdAndUpdate(nextActiveAsset._id, { activeNarration: true }, { session });

        await StoryNarrationModel.findByIdAndUpdate(
          audioAsset.narrationId,
          { activeAudioAssetId: nextActiveAsset._id },
          { session }
        );
      } else {
        await StoryNarrationModel.findByIdAndUpdate(
          audioAsset.narrationId,
          { $unset: { activeAudioAssetId: 1 } },
          { session }
        );
      }
    }

    await AudioAssetModel.findByIdAndUpdate(audioAssetId, { deletedAt: new Date() }, { session });
  });
}

export async function restoreAudioAsset(
  userId: string,
  narrationId: string,
  audioAssetId: string
): Promise<AudioAsset> {
  return withTransaction(async (session) => {
    await validateNarrationOwnership(userId, narrationId, session);

    const audioAsset = await validateAudioAssetOwnership(userId, audioAssetId, session);
    assertAudioAssetIsDeleted(audioAsset);

    if (audioAsset.narrationId?.toString() !== narrationId) {
      throw new BadRequestError('Audio asset does not belong to this narration');
    }

    const restoredAsset = await AudioAssetModel.findByIdAndUpdate(
      audioAssetId,
      { $unset: { deletedAt: 1 } },
      { new: true, session }
    );

    return restoredAsset as AudioAsset;
  });
}

// TODO : Upload audio asset for other types (background music, sound effects)
