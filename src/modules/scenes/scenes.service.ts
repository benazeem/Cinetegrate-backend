import safeParseJSON from '@utils/safeParseJSON.js';
import { SceneModel, Scene } from '@models/Scene.js';
import { StoryModel } from '@models/Story.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  InternalServerError,
} from '@middleware/error/index.js';
import mongoose, { ClientSession } from 'mongoose';
import { SCENE_ORDER_GAP } from '@constants/sceneConsts.js';
import type {
  CreateSceneInput,
  UpdateSceneInput,
  BulkReorderInput,
  RegenerateSceneInput,
  GenerateSceneInput,
  DurationInput,
} from '@validation/scenes.schema.js';
import { singleScenePrompt } from '@libs/ai/prompts/singleScenePrompt.js';
import { openRouterAI } from '@libs/ai/clients/openAI.js';
import { ContextProfileModel } from '@models/ContextProfile.js';
import { getContextProfileService } from '@modules/contextProfile/contextProfile.service.js';
import { batchScenesPrompt } from '@libs/ai/prompts/batchScenesPrompt.js';

// Helpers for -> Ownership and -> State validation
async function validateStoryOwnership(
  userId: string,
  storyId: string,
  session?: ClientSession
): Promise<typeof StoryModel.prototype> {
  const query = StoryModel.findOne({
    _id: storyId,
    userId,
    status: { $ne: 'delete' },
  });

  if (session) query.session(session);

  const story = await query;
  if (!story) {
    throw new NotFoundError('Story not found or access denied');
  }
  return story;
}

async function validateSceneOwnership(
  userId: string,
  sceneId: string,
  options?: { session?: ClientSession }
): Promise<Scene> {
  const query = SceneModel.findOne({
    _id: sceneId,
    userId,
  });
  if (options?.session) query.session(options.session);

  const scene = await query;
  if (!scene) {
    throw new NotFoundError('Scene not found or access denied');
  }
  return scene;
}

function assertSceneNotDeleted(scene: Scene): void {
  if (scene.deletedAt) {
    throw new ConflictError('Cannot perform operation on deleted scene');
  }
}

function assertSceneIsDeleted(scene: Scene): void {
  if (!scene.deletedAt) {
    throw new ConflictError('Scene is not deleted');
  }
}

// -> Ordering Helpers
async function getNextOrderValue(storyId: string, session?: ClientSession): Promise<number> {
  const query = SceneModel.findOne({ storyId }).sort({ order: -1 }).select('order');

  if (session) query.session(session);

  const lastScene = await query;
  return lastScene ? lastScene.order + SCENE_ORDER_GAP : SCENE_ORDER_GAP;
}

async function calculateOrderForPosition(
  storyId: string,
  position: number,
  session?: ClientSession
): Promise<number | null> {
  const query = SceneModel.find({ storyId }).sort({ order: 1 }).select('order');

  if (session) query.session(session);

  const scenes = await query;

  if (position >= scenes.length) {
    return scenes.length > 0 ? scenes[scenes.length - 1].order + SCENE_ORDER_GAP : SCENE_ORDER_GAP;
  }

  if (position === 0) {
    const firstOrder = scenes[0]?.order ?? SCENE_ORDER_GAP;
    const newOrder = Math.floor(firstOrder / 2);
    return newOrder > 0 ? newOrder : null;
  }

  const prevOrder = scenes[position - 1].order;
  const nextOrder = scenes[position].order;
  const midpoint = Math.floor((prevOrder + nextOrder) / 2);

  if (midpoint <= prevOrder || midpoint >= nextOrder) {
    return null;
  }

  return midpoint;
}

async function reindexSceneOrders(storyId: string, session: ClientSession): Promise<void> {
  const scenes = await SceneModel.find({ storyId }).sort({ order: 1 }).select('_id').session(session);

  const bulkOps = scenes.map((scene, index) => ({
    updateOne: {
      filter: { _id: scene._id },
      update: { $set: { order: (index + 1) * SCENE_ORDER_GAP } },
    },
  }));

  if (bulkOps.length > 0) {
    await SceneModel.bulkWrite(bulkOps, { session });
  }
}

// All scene services
export async function getSceneCount(userId: string, storyId: string): Promise<number> {
  await validateStoryOwnership(userId, storyId);
  const count = await SceneModel.countDocuments({
    storyId,
    userId,
    deletedAt: { $exists: false },
  });
  return count;
}

export async function getAllScenesForStory(userId: string, storyId: string): Promise<Scene[]> {
  await validateStoryOwnership(userId, storyId);

  const scenes = await SceneModel.find({
    storyId,
    userId,
    deletedAt: { $exists: false },
  }).sort({ order: 1 });

  return scenes;
}

export async function getAllDeletedScenes(userId: string, storyId: string): Promise<Scene[]> {
  await validateStoryOwnership(userId, storyId);
  const scenes = await SceneModel.find({
    storyId,
    userId,
    deletedAt: { $exists: true },
  }).sort({ order: 1 });
  return scenes;
}

export async function generateAllScenes(userId: string, storyId: string, total: number): Promise<Scene[]> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const story = await validateStoryOwnership(userId, storyId, session);

    const contextProfile = await ContextProfileModel.findOne({
      _id: story.contextProfileId,
    }).session(session);

    const generateScenesPrompt = batchScenesPrompt({
      mode: 'generate',
      storyTitle: story.title,
      storyContent: {
        summary: story.content.summary,
        body: story.content.body,
        keywords: story.content.keywords,
      },
      totalScenes: total,
      storyTimeLimit: story.timeLimit,
      contextProfile,
      intent: story.intent,
      platform: story.platform,
    });

    let generatedScenesData: any;

    try {
      const result = await openRouterAI(generateScenesPrompt);
      const rawContent = result?.choices?.[0]?.message?.content;

      if (!rawContent || typeof rawContent !== 'string') {
        throw new InternalServerError('AI generation failed');
      }

      generatedScenesData = safeParseJSON(rawContent);
    } catch {
      throw new InternalServerError('AI generation failed');
    }

    console.log(generatedScenesData);

    if (!generatedScenesData || !Array.isArray(generatedScenesData) || generatedScenesData.length !== total) {
      throw new InternalServerError('AI returned invalid scene structure');
    }

    const existing = await SceneModel.find(
      { storyId, userId, deletedAt: { $exists: false } },
      { _id: 1 }
    ).session(session);

    const ops = existing.map((doc, i) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            deletedAt: new Date(),
            order: -(Date.now() * 1000 + i),
          },
        },
      },
    }));

    await SceneModel.bulkWrite(ops, { session });

    const scenesToCreate = generatedScenesData.map((data: any, index: number) => ({
      userId,
      storyId,
      order: (index + 1) * SCENE_ORDER_GAP,
      title: data.title,
      description: data.description,
      authorType: 'ai' as const,
      imagePrompt: data.imagePrompt,
      videoPrompt: data.videoPrompt,
      duration: data.duration,
    }));

    const scenes = (await SceneModel.insertMany(scenesToCreate, {
      session,
      ordered: true,
    })) as Scene[];

    await session.commitTransaction();
    return scenes;
  } catch (error) {
    console.error('REAL ERROR:', error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function regenerateAllScenes(
  userId: string,
  storyId: string,
  extraPrompt?: string
): Promise<Scene[]> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const story = await validateStoryOwnership(userId, storyId, session);

    const existingScenes = await SceneModel.find({
      storyId,
      userId,
      deletedAt: { $exists: false },
    })
      .sort({ order: 1 })
      .lean()
      .session(session);

    if (existingScenes.length === 0) {
      throw new ConflictError('No scenes to regenerate');
    }

    const totalScenes = existingScenes.length;

    const contextProfile = await ContextProfileModel.findOne({
      _id: story.contextProfileId,
    }).session(session);

    const regenerateScenesPrompt = batchScenesPrompt({
      mode: 'regenerate',
      storyTitle: story.title,
      storyContent: {
        summary: story.content.summary,
        body: story.content.body,
        keywords: story.content.keywords,
      },
      totalScenes,
      storyTimeLimit: story.timeLimit,
      contextProfile,
      intent: story.intent,
      platform: story.platform,
      extraPrompt,
    });

    let regeneratedScenesData: any;

    try {
      const result = await openRouterAI(regenerateScenesPrompt);
      const rawContent = result?.choices?.[0]?.message?.content;

      if (!rawContent || typeof rawContent !== 'string') {
        throw new InternalServerError('AI regeneration failed');
      }

      regeneratedScenesData = safeParseJSON(rawContent);
    } catch {
      throw new InternalServerError('AI regeneration failed');
    }

    console.log(regeneratedScenesData);

    if (
      !regeneratedScenesData ||
      !Array.isArray(regeneratedScenesData) ||
      regeneratedScenesData.length !== totalScenes
    ) {
      throw new InternalServerError('AI returned invalid scene structure');
    }

    // Soft-delete old scenes ONLY after AI is validated
    const ops = existingScenes.map((doc, i) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            deletedAt: new Date(),
            order: -(Date.now() * 1000 + i),
          },
        },
      },
    }));

    await SceneModel.bulkWrite(ops, { session });

    const scenesToCreate = regeneratedScenesData.map((data: any, index: number) => ({
      userId,
      storyId,
      order: (index + 1) * SCENE_ORDER_GAP,
      title: data.title,
      description: data.description,
      authorType: 'ai' as const,
      imagePrompt: data.imagePrompt,
      videoPrompt: data.videoPrompt,
      duration: data.duration,
    }));

    const scenes = (await SceneModel.insertMany(scenesToCreate, {
      session,
      ordered: true,
    })) as Scene[];

    await session.commitTransaction();
    return scenes;
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function restoreAllDeletedScenes(userId: string, storyId: string): Promise<Scene[]> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await validateStoryOwnership(userId, storyId, session);
    const activeScenes = await SceneModel.find({ storyId, userId, deletedAt: { $exists: false } })
      .sort({ order: -1 })
      .lean()
      .session(session);
    const lastOrder = activeScenes[0]?.order ?? 0;
    const scenesToRestore = await SceneModel.find({
      storyId,
      userId,
      deletedAt: { $exists: true },
    }).session(session);
    if (scenesToRestore.length === 0) {
      throw new BadRequestError('No deleted scenes to restore');
    }
    const bulkOps = scenesToRestore.map((scene, index) => ({
      updateOne: {
        filter: { _id: scene._id },
        update: { $unset: { deletedAt: '' }, $set: { order: lastOrder + (index + 1) * SCENE_ORDER_GAP } },
      },
    }));
    await SceneModel.bulkWrite(bulkOps, { session });
    const restoredScenes = await SceneModel.find({
      storyId,
      userId,
    })
      .sort({ order: 1 })
      .lean()
      .session(session);
    await session.commitTransaction();
    return restoredScenes;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Bulk scene services
export async function bulkRestoreScenes(
  userId: string,
  storyId: string,
  sceneIds: string[]
): Promise<Scene[]> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await validateStoryOwnership(userId, storyId, session);
    const activeScenes = await SceneModel.find({ storyId, userId, deletedAt: { $exists: false } })
      .sort({ order: -1 })
      .lean()
      .session(session);
    const lastOrder = activeScenes[0]?.order ?? 0;
    const scenesToRestore = await SceneModel.find({
      _id: { $in: sceneIds },
      storyId,
      userId,
      deletedAt: { $exists: true },
    }).session(session);

    if (scenesToRestore.length === 0) {
      throw new BadRequestError('No valid scenes to restore');
    }
    const bulkOps = scenesToRestore.map((scene, index) => ({
      updateOne: {
        filter: { _id: scene._id },
        update: { $unset: { deletedAt: '' }, $set: { order: lastOrder + (index + 1) * SCENE_ORDER_GAP } },
      },
    }));
    await SceneModel.bulkWrite(bulkOps, { session });

    const restoredScenes = await SceneModel.find({
      _id: { $in: sceneIds },
      storyId,
      userId,
    })
      .sort({ order: 1 })
      .lean()
      .session(session);
    await session.commitTransaction();
    return restoredScenes;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function bulkReorder(
  userId: string,
  storyId: string,
  newOrderArray: BulkReorderInput
): Promise<Scene[]> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await validateStoryOwnership(userId, storyId, session);

    const sceneIds = newOrderArray.sceneIds;

    const existingScenes = await SceneModel.find({
      _id: { $in: sceneIds },
      storyId,
      userId,
      deletedAt: { $exists: false },
    }).session(session);

    if (existingScenes.length !== sceneIds.length) {
      throw new BadRequestError('Invalid scene IDs or scenes not in this story');
    }

    const uniqueIds = new Set(sceneIds);
    if (uniqueIds.size !== sceneIds.length) {
      throw new BadRequestError('Duplicate scene IDs in order array');
    }

    const tempOps = sceneIds.map((sceneId, index) => ({
      updateOne: {
        filter: { _id: sceneId, storyId, userId },
        update: { $set: { order: -1 * (index + 1) } },
      },
    }));

    await SceneModel.bulkWrite(tempOps, { session });

    const finalOps = sceneIds.map((sceneId, index) => ({
      updateOne: {
        filter: { _id: sceneId, storyId, userId },
        update: { $set: { order: (index + 1) * SCENE_ORDER_GAP }, $unset: { deletedAt: '' } },
      },
    }));

    await SceneModel.bulkWrite(finalOps, { session });

    const updatedScenes = await SceneModel.find({
      storyId,
      userId,
      deletedAt: { $exists: false },
    })
      .sort({ order: 1 })
      .lean()
      .session(session);

    await session.commitTransaction();
    return updatedScenes;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Single scene services
export async function getSceneById(userId: string, storyId: string, sceneId: string): Promise<Scene> {
  await validateStoryOwnership(userId, storyId);

  const scene = await SceneModel.findOne({
    _id: sceneId,
    storyId,
    userId,
  });

  if (!scene) {
    throw new NotFoundError('Scene not found');
  }

  return scene;
}

export async function createScene(
  userId: string,
  storyId: string,
  payload: CreateSceneInput,
  position?: number
): Promise<Scene> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await validateStoryOwnership(userId, storyId, session);

    let orderValue: number;

    if (position === undefined || position === null) {
      orderValue = await getNextOrderValue(storyId, session);
    } else {
      const calculatedOrder = await calculateOrderForPosition(storyId, position, session);

      if (calculatedOrder === null) {
        await reindexSceneOrders(storyId, session);
        const newOrder = await calculateOrderForPosition(storyId, position, session);
        orderValue = newOrder ?? (position + 1) * SCENE_ORDER_GAP;
      } else {
        orderValue = calculatedOrder;
      }
    }

    const [scene] = await SceneModel.create(
      [
        {
          userId,
          storyId,
          order: orderValue,
          title: payload.title,
          description: payload.description,
          authorType: 'user',
          imagePrompt: payload.imagePrompt,
          videoPrompt: payload.videoPrompt,
          duration: payload.duration,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return scene;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function generateSceneWithAI(
  userId: string,
  storyId: string,
  input?: GenerateSceneInput
): Promise<Scene> {
  const position = input?.position;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const story = await validateStoryOwnership(userId, storyId, session);

    let orderValue: number;
    if (position === undefined || position === null) {
      orderValue = await getNextOrderValue(storyId, session);
    } else {
      const calculatedOrder = await calculateOrderForPosition(storyId, position, session);
      if (calculatedOrder === null) {
        await reindexSceneOrders(storyId, session);
        const newOrder = await calculateOrderForPosition(storyId, position, session);
        orderValue = newOrder ?? (position + 1) * SCENE_ORDER_GAP;
      } else {
        orderValue = calculatedOrder;
      }
    }

    // check if this affects total scenes duration limit with time limit

    const scenes = await SceneModel.find({ storyId, userId, deletedAt: { $exists: false } })
      .lean()
      .session(session);

    const previousScenesSummary = scenes
      .filter((s) => s.order < orderValue)
      .map((s) => `${s.title}: ${s.description}`)
      .join(' | ');
    const nextScenesSummary = scenes
      .filter((s) => s.order > orderValue)
      .map((s) => `${s.title}: ${s.description}`)
      .join(' | ');

    const prompt = singleScenePrompt({
      mode: 'generate',
      storyTitle: story.title,
      storyContent: {
        summary: story.content.summary,
        keywords: story.content.keywords,
        tags: story.content.tags,
      },
      sceneIndex: position !== undefined && position !== null ? position + 1 : scenes.length + 1,
      totalScenes: scenes.length + 1,
      timeLimit: 3,
      previousScenesSummary,
      nextScenesSummary,
      intent: story.intent,
      platform: story.platform,
    });

    let aiGeneratedContent: any;
    try {
      const result = await openRouterAI(prompt);
      const rawContent = result?.choices?.[0]?.message?.content;
      if (typeof rawContent !== 'string' || rawContent.trim().length === 0) {
        throw new InternalServerError('AI generation failed');
      }
      aiGeneratedContent = safeParseJSON(rawContent);
    } catch (err) {
      throw new InternalServerError('AI generation failed');
    }
    if (!aiGeneratedContent) {
      throw new InternalServerError('AI generation failed');
    }
    if (!aiGeneratedContent.title || !aiGeneratedContent.description) {
      throw new InternalServerError('AI generation returned incomplete data');
    }

    const [scene] = await SceneModel.create(
      [
        {
          userId,
          storyId,
          order: orderValue,
          title: aiGeneratedContent.title,
          description: aiGeneratedContent.description,
          authorType: 'ai',
          imagePrompt: aiGeneratedContent.imagePrompt,
          videoPrompt: aiGeneratedContent.videoPrompt,
          duration: aiGeneratedContent.duration,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return scene;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function regenerateScene(
  userId: string,
  sceneId: string,
  input?: RegenerateSceneInput
): Promise<Scene> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const scene = await validateSceneOwnership(userId, sceneId, { session });
    assertSceneNotDeleted(scene);

    const story = await StoryModel.findById(scene.storyId).session(session);
    if (!story) {
      throw new NotFoundError('Parent story not found');
    }

    const contextProfile = await ContextProfileModel.findOne({ _id: story.contextProfileId }).session(
      session
    );

    const scenes = await SceneModel.find({ storyId: scene.storyId, userId, deletedAt: { $exists: false } })
      .lean()
      .session(session);

    const previousScenesSummary = scenes
      .filter((s) => s.order < scene.order)
      .map((s) => `${s.title}: ${s.description}`)
      .join(' | ');
    const nextScenesSummary = scenes
      .filter((s) => s.order > scene.order)
      .map((s) => `${s.title}: ${s.description}`)
      .join(' | ');

    const sceneIndex = scenes.filter((s) => s.order < scene.order).length + 1;

    const regenerateScenePrompt = singleScenePrompt({
      mode: 'regenerate',
      storyTitle: story.title,
      storyContent: {
        summary: story.content.summary,
        keywords: story.content.keywords,
        tags: story.content.tags,
      },
      sceneIndex,
      totalScenes: scenes.length,
      timeLimit: 3,
      previousScenesSummary,
      nextScenesSummary,
      contextProfile,
      baseScene: `${scene.title}: ${scene.description}`,
      extraPrompt: input?.extraPrompt,
      intent: story.intent,
      platform: story.platform,
    });

    let aiRegeneratedContent: any;
    try {
      const result = await openRouterAI(regenerateScenePrompt);
      const rawContent = result?.choices?.[0]?.message?.content;

      if (typeof rawContent !== 'string' || rawContent.trim().length === 0) {
        throw new InternalServerError('AI regeneration failed');
      }
      aiRegeneratedContent = safeParseJSON(rawContent);
    } catch (err) {
      throw new InternalServerError('AI regeneration failed');
    }

    if (!aiRegeneratedContent) {
      throw new InternalServerError('AI regeneration failed');
    }

    const updatedScene = await SceneModel.findByIdAndUpdate(
      sceneId,
      {
        $set: {
          title: aiRegeneratedContent.title,
          description: aiRegeneratedContent.description,
          imagePrompt: aiRegeneratedContent.imagePrompt,
          videoPrompt: aiRegeneratedContent.videoPrompt,
          duration: aiRegeneratedContent.duration,
          authorType: 'ai',
        },
      },
      { new: true, session }
    );

    if (!updatedScene) {
      throw new NotFoundError('Failed to regenerate scene');
    }

    await session.commitTransaction();
    return updatedScene;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function updateScene(
  userId: string,
  sceneId: string,
  updates: UpdateSceneInput
): Promise<Scene> {
  const scene = await validateSceneOwnership(userId, sceneId);
  assertSceneNotDeleted(scene);

  const updateFields: any = {};
  if (updates.title !== undefined) updateFields.title = updates.title;
  if (updates.description !== undefined) updateFields.description = updates.description;
  if (updates.imagePrompt !== undefined) updateFields.imagePrompt = updates.imagePrompt;
  if (updates.videoPrompt !== undefined) updateFields.videoPrompt = updates.videoPrompt;

  if (Object.keys(updateFields).length > 0) {
    updateFields.authorType = 'user';
  }

  const updatedScene = await SceneModel.findByIdAndUpdate(
    sceneId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedScene) {
    throw new NotFoundError('Scene not found');
  }

  return updatedScene;
}

export async function updateSceneDuration(userId: string, sceneId: string, duration: number): Promise<Scene> {
  const scene = await validateSceneOwnership(userId, sceneId);
  assertSceneNotDeleted(scene);
  // check if this update does not effect total scenes duration limit with  story time limit
  const updatedScene = await SceneModel.findByIdAndUpdate(
    sceneId,
    { $set: { duration } },
    { new: true, runValidators: true }
  );
  if (!updatedScene) {
    throw new NotFoundError('Scene not found');
  }
  return updatedScene;
}

export async function moveSceneByOne(
  userId: string,
  sceneId: string,
  direction: 'prev' | 'next'
): Promise<{ moved: Scene; swappedWith: Scene }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const scene = await validateSceneOwnership(userId, sceneId, { session });
    assertSceneNotDeleted(scene);

    const operator = direction === 'prev' ? '$lt' : '$gt';
    const sortOrder = direction === 'prev' ? -1 : 1;

    const neighbor = await SceneModel.findOne({
      storyId: scene.storyId,
      userId,
      deletedAt: { $exists: false },
      order: { [operator]: scene.order },
      _id: { $ne: sceneId },
    })
      .sort({ order: sortOrder })
      .session(session);

    if (!neighbor) {
      throw new BadRequestError(`Cannot move scene ${direction}`);
    }

    const tempOrder = scene.order;

    const tempSwapOrder = -Date.now();

    await SceneModel.findByIdAndUpdate(sceneId, { $set: { order: tempSwapOrder } }, { session });

    const updatedNeighbor = await SceneModel.findByIdAndUpdate(
      neighbor._id,
      { $set: { order: tempOrder } },
      { new: true, session }
    );

    const updatedScene = await SceneModel.findByIdAndUpdate(
      sceneId,
      { $set: { order: neighbor.order } },
      { new: true, session }
    );

    if (!updatedScene || !updatedNeighbor) {
      throw new NotFoundError('Failed to move scenes');
    }

    await session.commitTransaction();

    return {
      moved: updatedScene,
      swappedWith: updatedNeighbor,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function softDeleteScene(userId: string, sceneId: string): Promise<boolean> {
  const scene = await validateSceneOwnership(userId, sceneId);
  assertSceneNotDeleted(scene);

  await SceneModel.findByIdAndUpdate(sceneId, { $set: { deletedAt: new Date(), order: -Date.now() } });
  return true;
}

export async function restoreScene(userId: string, sceneId: string): Promise<Scene> {
  const scene = await validateSceneOwnership(userId, sceneId);
  assertSceneIsDeleted(scene);
  const maxOrderScene = await SceneModel.findOne({
    storyId: scene.storyId,
    userId,
    deletedAt: { $exists: false },
  })
    .sort({ order: -1 })
    .lean();
  const newOrder = maxOrderScene ? maxOrderScene.order + SCENE_ORDER_GAP : SCENE_ORDER_GAP;
  const restoredScene = await SceneModel.findByIdAndUpdate(
    sceneId,
    { $unset: { deletedAt: '' }, $set: { order: newOrder } },
    { new: true, runValidators: true }
  );
  if (!restoredScene) {
    throw new NotFoundError('Scene not found');
  }
  return restoredScene;
}

// FUTURE IMPLEMENTATION: Permanent delete scene
export async function duplicateScene(userId: string, sceneId: string): Promise<Scene> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const scene = await validateSceneOwnership(userId, sceneId, { session });
    assertSceneNotDeleted(scene);

    const newOrder = await getNextOrderValue(scene.storyId.toString(), session);

    const [duplicatedScene] = await SceneModel.create(
      [
        {
          userId,
          storyId: scene.storyId,
          order: newOrder,
          title: scene.title ? `${scene.title} (Copy)` : undefined,
          description: scene.description,
          authorType: 'user',
          imagePrompt: scene.imagePrompt,
          videoPrompt: scene.videoPrompt,
          duration: scene.duration,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return duplicatedScene;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function purgeDeletedScenes(userId: string, storyId: string): Promise<number> {
  await validateStoryOwnership(userId, storyId);
  return 0;
}
