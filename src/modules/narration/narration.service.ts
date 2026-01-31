import fs from 'fs/promises';
import fsCallback from 'fs';

import { ContextProfileModel } from '@models/ContextProfile.js';
import { NarrationSegment, StoryNarration, StoryNarrationModel } from '@models/Narration.js';
import { SceneModel } from '@models/Scene.js';
import safeParseJSON from '@utils/safeParseJSON.js';
import { buildStoryNarrationPrompt } from '@libs/ai/prompts/narrationPrompt.js';
import { openRouterAI } from '@libs/ai/clients/openAI.js';
import { BadRequestError, ConflictError, NotFoundError } from '@middleware/error/index.js';
import { Pagination, Sorting } from 'types/Pagination.js';
import { withTransaction } from '@db/withTransaction.js';
import { validateNarrationOwnership } from 'validators/validateNarrationOwnership.js';
import { assertHasActiveScenes } from 'domain/assertions/assertSceneState.js';
import { assertStoryIsActive, assertStoryNotDeleted } from 'domain/assertions/assertStoryState.js';
import { validateStoryOwnership } from 'validators/validateStoryOwnership.js';
import {
  assertNarrationIsDeleted,
  assertNarrationNotDeleted,
} from 'domain/assertions/assertNarrationState.js';
import { AudioAssetModel } from '@models/AudioAsset.js';
import { assertNarrationFitsTime } from 'domain/assertions/assertNarrationFitsTime.js';
import { hashSceneOrder } from '@utils/hashSceneOrder.js';
import { assertCharacterFits } from 'domain/assertions/assertCharacterFits.js';
import { Types } from 'mongoose';

export async function getAllNarrationsForStory(
  userId: string,
  storyId: string,
  pagination: Pagination,
  sorting: Sorting
) {
  const { page, limit, skip } = pagination;

  const sortOptions: Record<string, 1 | -1> = {};
  sortOptions[sorting.sortBy || 'version'] = sorting.sortOrder || -1;

  const [narrations, total] = await Promise.all([
    StoryNarrationModel.find({
      userId,
      storyId,
      deletedAt: { $exists: false },
    })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    StoryNarrationModel.countDocuments({
      userId,
      storyId,
      deletedAt: { $exists: false },
    }),
  ]);

  return [narrations, total];
}

export async function getAllDeletedNarrations(
  userId: string,
  storyId: string,
  pagination: Pagination,
  sorting: Sorting
) {
  const { page, limit, skip } = pagination;

  const sortOptions: Record<string, 1 | -1> = {};
  sortOptions[sorting.sortBy || 'version'] = sorting.sortOrder || -1;

  const [narrations, total] = await Promise.all([
    StoryNarrationModel.find({
      userId,
      storyId,
      deletedAt: { $exists: true },
    })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    StoryNarrationModel.countDocuments({
      userId,
      storyId,
      deletedAt: { $exists: true },
    }),
  ]);

  return [narrations, total];
}

export async function getAllNarrationForSceneOrder(userId: string, storyId: string, sceneOrderIds: string[]) {
  const sceneOrderHash = hashSceneOrder(sceneOrderIds.map((id) => new Types.ObjectId(id)));
  const narration = await StoryNarrationModel.findOne({
    userId,
    storyId,
    sceneOrderHash,
    deletedAt: { $exists: false },
  });
  return narration;
}

// For single narration
export async function getActiveNarration(userId: string, storyId: string) {
  const narration = await StoryNarrationModel.findOne({
    userId,
    storyId,
    active: true,
    deletedAt: { $exists: false },
  });

  return narration;
}

export async function getNarrationById(userId: string, narrationId: string) {
  const narration = await validateNarrationOwnership(userId, narrationId);
  return narration;
}

export async function generateNarration(userId: string, storyId: string) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);

    assertStoryIsActive(story);

    const scenes = await SceneModel.find({
      userId,
      storyId,
      deletedAt: { $exists: false },
      active: true,
    })
      .sort({ order: 1 })
      .session(session);

    assertHasActiveScenes(scenes);

    const lastVersion = await StoryNarrationModel.findOne({
      storyId,
      sceneOrder: scenes.map((s) => s._id),
    })
      .sort({ version: -1 })
      .session(session);

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration ?? 0), 0);

    if (totalDuration <= 0) {
      throw new BadRequestError('Total scene duration must be greater than 0');
    }

    const contextProfile = await ContextProfileModel.findOne({ userId, storyId }).lean().session(session);

    const prompt = buildStoryNarrationPrompt({
      storyTitle: story.title || 'Story',
      storyContent: {
        body: story.content.body,
        keywords: story.content.keywords,
        tags: story.content.tags,
      },
      scenes,
      storyTimeLimit: totalDuration,
      intent: story.intent,
      platform: story.platform,
      contextProfile,
    });

    const result = await openRouterAI(prompt);
    const raw = result?.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error('AI service did not return any content');
    }

    const parsed = safeParseJSON(raw);

    if (!parsed || !parsed.narrationSegments || !Array.isArray(parsed.narrationSegments)) {
      throw new BadRequestError('Invalid narration structure from AI');
    }

    if (parsed.narrationSegments.length === 0) {
      throw new BadRequestError('AI generated empty narration segments');
    }

    await StoryNarrationModel.updateMany({ storyId, active: true }, { $set: { active: false } }, { session });

    const sceneOrder = scenes.map((s) => s._id);
    const sceneOrderHash = hashSceneOrder(sceneOrder);

    const [narration] = await StoryNarrationModel.create(
      [
        {
          userId,
          storyId,
          sceneOrder,
          sceneOrderHash,
          narrationSegments: parsed.narrationSegments,
          totalDuration: parsed.totalDuration || totalDuration,
          version,
          active: true,
          source: 'ai',
        },
      ],
      { session }
    );

    return narration as StoryNarration;
  });
}

export async function regenerateNarration(userId: string, narrationId: string, extraPrompt: string) {
  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);

    const story = await validateStoryOwnership(userId, narration.storyId.toString(), session);
    assertStoryNotDeleted(story);
    assertStoryIsActive(story);

    const scenes = await SceneModel.find({
      userId,
      storyId: narration.storyId,
      deletedAt: { $exists: false },
    })
      .sort({ order: 1 })
      .session(session);

    assertHasActiveScenes(scenes);

    const checkPass = scenes.every((s, index) => s._id.equals(narration.sceneOrder[index]));
    if (!checkPass) {
      throw new BadRequestError('Scenes have changed since last narration generation');
    }

    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration ?? 0), 0);

    if (totalDuration <= 0) {
      throw new BadRequestError('Total scene duration must be greater than 0');
    }

    const contextProfile = await ContextProfileModel.findOne({ userId, storyId: narration.storyId })
      .lean()
      .session(session);

    const prompt = buildStoryNarrationPrompt({
      storyTitle: story.title || 'Story',
      storyContent: {
        body: story.content.body,
        keywords: story.content.keywords,
        tags: story.content.tags,
      },
      scenes,
      storyTimeLimit: totalDuration,
      intent: story.intent,
      platform: story.platform,
      contextProfile,
      extraPrompt,
    });

    const result = await openRouterAI(prompt);
    const raw = result?.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error('AI service did not return any content');
    }

    const parsed = safeParseJSON(raw);

    if (!parsed || !parsed.narrationSegments || !Array.isArray(parsed.narrationSegments)) {
      throw new BadRequestError('Invalid narration structure from AI');
    }

    if (parsed.narrationSegments.length === 0) {
      throw new BadRequestError('AI generated empty narration segments');
    }

    const updatedNarration = await StoryNarrationModel.findByIdAndUpdate(
      narrationId,
      {
        userId,
        storyId: narration.storyId,
        narrationSegments: parsed.narrationSegments,
        totalDuration: parsed.totalDuration || totalDuration,
        source: 'ai',
      },
      { runValidators: true, new: true, session }
    );

    return updatedNarration as StoryNarration;
  });
}

export async function createEmptyNarration(userId: string, storyId: string) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);
    assertStoryIsActive(story);
    const scenes = await SceneModel.find({
      userId,
      storyId,
      deletedAt: { $exists: false },
      active: true,
    })
      .sort({ order: 1 })
      .session(session);
    if (!scenes.length) {
      throw new BadRequestError('No scenes found for this story');
    }
    const expectedDuration = scenes.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    if (expectedDuration <= 0) {
      throw new BadRequestError('Total scene duration must be greater than 0');
    }
    const lastVersion = await StoryNarrationModel.findOne({ storyId }).sort({ version: -1 }).session(session);
    const version = lastVersion ? lastVersion.version + 1 : 1;
    await StoryNarrationModel.updateMany({ storyId, active: true }, { $set: { active: false } }, { session });
    const sceneOrder = scenes.map((s) => s._id);
    const sceneOrderHash = hashSceneOrder(sceneOrder);
    const [narration] = await StoryNarrationModel.create(
      [
        {
          userId,
          storyId,
          sceneOrder,
          sceneOrderHash,
          narrationSegments: [],
          version,
          active: true,
          source: 'user',
        },
      ],
      { session }
    );
    return narration;
  });
}

export async function createNarrationFromJSON(
  userId: string,
  storyId: string,
  narrationSegments: NarrationSegment[]
) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);
    assertStoryIsActive(story);
    if (!Array.isArray(narrationSegments) || narrationSegments.length === 0) {
      throw new BadRequestError('Invalid narration segments: must be a non-empty array');
    }

    const scenes = await SceneModel.find({
      userId,
      storyId,
      deletedAt: { $exists: false },
      active: true,
    })
      .sort({ order: 1 })
      .session(session);

    if (!scenes.length) {
      throw new BadRequestError('No scenes found for this story');
    }

    const contextProfile = await ContextProfileModel.findById(story.contextProfileId).session(session).lean();
    if (!contextProfile) {
      throw new BadRequestError('Context profile not found for narration validation');
    }

    assertCharacterFits(narrationSegments, contextProfile);

    for (const seg of narrationSegments) {
      if (
        typeof seg.startTime !== 'number' ||
        typeof seg.endTime !== 'number' ||
        typeof seg.duration !== 'number' ||
        seg.startTime < 0 ||
        seg.endTime <= seg.startTime ||
        seg.duration <= 0 ||
        typeof seg.narration !== 'string'
      ) {
        throw new BadRequestError(`Invalid narration segment ${seg.narration}`);
      }

      const computed = seg.endTime - seg.startTime;
      if (Math.abs(computed - seg.duration) > 0.25) {
        throw new BadRequestError('Segment duration mismatch');
      }

      assertNarrationFitsTime({
        durationSeconds: seg.duration,
        narrationText: seg.narration,
        profile: contextProfile.narrationProfile,
      });
    }

    const expectedDuration = scenes.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const totalDuration = narrationSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0);

    if (totalDuration <= 0) {
      throw new BadRequestError('Total duration must be greater than 0');
    }

    if (totalDuration > expectedDuration) {
      throw new BadRequestError('Total duration of narration segments exceeds total duration of scenes');
    }

    const lastVersion = await StoryNarrationModel.findOne({ storyId }).sort({ version: -1 }).session(session);

    const version = lastVersion ? lastVersion.version + 1 : 1;

    await StoryNarrationModel.updateMany({ storyId, active: true }, { $set: { active: false } }, { session });
    const sceneOrder = scenes.map((s) => s._id);
    const sceneOrderHash = hashSceneOrder(sceneOrder);

    const [narration] = await StoryNarrationModel.create(
      [
        {
          userId,
          storyId,
          sceneOrder,
          sceneOrderHash,
          narrationSegments,
          totalDuration,
          version,
          active: true,
          source: 'user',
        },
      ],
      { session }
    );

    return narration;
  });
}

export async function uploadNarrationJSONFromFile(userId: string, storyId: string, filePath: string) {
  let parsed: any;

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent) {
      throw new BadRequestError('Uploaded file is empty');
    }
    parsed = JSON.parse(fileContent);
  } catch (err) {
    throw new BadRequestError('Invalid JSON file format', err);
  } finally {
    const cleanUp = (retry = 0) => {
      fsCallback.unlink(filePath, (err: any) => {
        if (err && retry < 3) {
          setTimeout(() => cleanUp(retry + 1), 100);
        }
      });
    };
    cleanUp();
  }

  if (!parsed || !parsed.narrationSegments || !Array.isArray(parsed.narrationSegments)) {
    throw new BadRequestError('Invalid JSON structure. Expected { narrationSegments: [...] }');
  }

  return createNarrationFromJSON(userId, storyId, parsed.narrationSegments as NarrationSegment[]);
}

export async function updateNarration(
  userId: string,
  storyId: string,
  narrationId: string,
  narrationSegments: NarrationSegment[]
) {
  if (!Array.isArray(narrationSegments) || narrationSegments.length === 0) {
    throw new BadRequestError('Invalid segments: must be a non-empty array');
  }

  const story = await validateStoryOwnership(userId, storyId);
  assertStoryIsActive(story);

  const contextProfile = await ContextProfileModel.findById(story.contextProfileId).lean();
  if (!contextProfile) {
    throw new BadRequestError('Context profile not found for narration validation');
  }

  assertCharacterFits(narrationSegments, contextProfile);

  for (const seg of narrationSegments) {
    if (
      typeof seg.startTime !== 'number' ||
      typeof seg.endTime !== 'number' ||
      typeof seg.duration !== 'number' ||
      seg.startTime < 0 ||
      seg.endTime <= seg.startTime ||
      seg.duration <= 0 ||
      typeof seg.narration !== 'string'
    ) {
      throw new BadRequestError('Invalid narration segment');
    }

    const computed = seg.endTime - seg.startTime;
    if (Math.abs(computed - seg.duration) > 0.25) {
      throw new BadRequestError('Segment duration mismatch');
    }

    assertNarrationFitsTime({
      durationSeconds: seg.duration,
      narrationText: seg.narration,
      profile: contextProfile.narrationProfile,
    });
  }

  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);
    assertNarrationNotDeleted(narration);

    //TODO: Store Order Hash in somewhere to compare fast later
    const scenes = await SceneModel.find({
      userId,
      storyId: narration.storyId,
      deletedAt: { $exists: false },
      active: true,
    })
      .sort({ order: 1 })
      .session(session);

    if (hashSceneOrder(scenes.map((s) => s._id)) !== narration.sceneOrderHash) {
      throw new BadRequestError('Narration no longer matches current scene order');
    }

    const expectedDuration = scenes.reduce((s, x) => s + (x.duration ?? 0), 0);
    const totalDuration = narrationSegments.reduce((s, x) => s + x.duration, 0);

    if (totalDuration <= 0 || totalDuration > expectedDuration) {
      throw new BadRequestError('Narration duration exceeds scene duration');
    }

    const updated = await StoryNarrationModel.findByIdAndUpdate(
      narrationId,
      {
        $set: {
          narrationSegments,
          totalDuration,
        },
      },
      { new: true, runValidators: true, session }
    );
    if (!updated) {
      throw new ConflictError('Failed to update narration');
    }

    await AudioAssetModel.updateMany(
      {
        narrationId,
        deletedAt: { $exists: false },
      },
      {
        $set: { deletedAt: new Date() },
      },
      { session }
    );

    return updated;
  });
}

export async function softDeleteNarration(userId: string, narrationId: string): Promise<void> {
  return withTransaction(async (session) => {
    const narration = await StoryNarrationModel.findOneAndUpdate(
      { _id: narrationId, userId, deletedAt: { $exists: false } },
      {
        $set: { deletedAt: new Date(), active: false },
      },
      { new: true, session }
    );

    if (!narration) {
      throw new NotFoundError('Narration not found or already deleted ');
    }
    await AudioAssetModel.updateMany(
      {
        narrationId: narration._id,
        deletedAt: { $exists: false },
      },
      { $set: { deletedAt: new Date() }, new: true, session }
    );
  });
}

export async function permanentDeleteNarration(userId: string, narrationId: string) {
  return withTransaction(async (session) => {
    const narration = await StoryNarrationModel.findOneAndDelete(
      {
        _id: narrationId,
        userId,
        deletedAt: { $exists: true },
      },
      { session }
    );
    if (!narration) {
      throw new NotFoundError('Narration not found or not deleted');
    }
    await AudioAssetModel.deleteMany({ narrationId: narration._id }, { session });
  });
}

export async function restoreNarration(userId: string, narrationId: string) {
  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);
    assertNarrationIsDeleted(narration);

    const restoredNarration = await StoryNarrationModel.findOneAndUpdate(
      { _id: narrationId, userId, deletedAt: { $exists: true } },
      {
        $unset: { deletedAt: 1 },
      },
      { new: true, session, lean: true }
    );

    if (!restoredNarration) {
      throw new NotFoundError('Narration not found');
    }

    await AudioAssetModel.updateMany(
      {
        narrationId: narration._id,
        deletedAt: { $exists: true },
      },
      { $unset: { deletedAt: 1 } },
      {
        session,
      }
    );

    return restoredNarration;
  });
}

export async function switchActiveNarration(userId: string, narrationId: string) {
  return withTransaction(async (session) => {
    const narration = await validateNarrationOwnership(userId, narrationId, session);
    assertNarrationNotDeleted(narration);

    await StoryNarrationModel.updateMany(
      {
        sceneOrderHash: narration.sceneOrderHash,
        active: true,
        deletedAt: { $exists: false },
        _id: { $ne: narrationId },
      },
      { $set: { active: false } },
      { session }
    );

    const activateNarration = await StoryNarrationModel.findOneAndUpdate(
      { _id: narrationId, deletedAt: { $exists: false }, active: false },
      {
        active: true,
      },
      {
        new: true,
        session,
        lean: true,
      }
    );

    if (!activateNarration) {
      throw new ConflictError('Failed to update active status');
    }

    return activateNarration;
  });
}

// Final Story Audio Text
export async function getFinalNarrationText(userId: string, narrationId: string, storyId: string) {
  const activeNarration = await StoryNarrationModel.findOne({
    storyId,
    active: true,
    deletedAt: { $exists: false },
  });
  if (!activeNarration) {
    throw new NotFoundError('Active narration not found for this story');
  }
  return activeNarration.narrationSegments.map((seg) => seg.narration).join(' ');
}
