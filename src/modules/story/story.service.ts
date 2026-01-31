import { ConflictError, NotFoundError } from '@middleware/error/index.js';
import { ContextProfileModel, ContextScope, GenreType } from '@models/ContextProfile.js';
import { ProjectModel } from '@models/Project.js';
import { StoryModel } from '@models/Story.js';
import safeParseJSON from '@utils/safeParseJSON.js';
import {
  AddStoryContextInput,
  CreateStoryInput,
  RegenerateStoryInput,
  SetStoryContextInput,
} from '@validation/story.schema.js';
import { NARRATION_PROFILES } from 'constants/narrationProfiles.js';
import { openRouterAI } from 'libs/ai/clients/openAI.js';
import { generateStoryPrompt } from '@libs/ai/prompts/generateStoryPrompt.js';
import { generateStoryRegenerationPrompt } from 'libs/ai/prompts/generateStoryRegenerationPrompt.js';
import { Pagination, Sorting } from 'types/Pagination.js';
import { isSameContextContract } from 'domain/policies/isSameContextContract.js';
import { validateStoryOwnership } from 'validators/validateStoryOwnership.js';
import { withTransaction } from '@db/withTransaction.js';
import {
  assertStoryIsActive,
  assertStoryIsDeleted,
  assertStoryNotDeleted,
} from 'domain/assertions/assertStoryState.js';

export async function getUserStories(userId: string, pagination: Pagination, sorting: Sorting) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId, status: { $in: ['active', 'draft'] } })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, status: { $in: ['active', 'draft'] } }) as Promise<number>,
  ]);

  return [stories, total];
}

export async function getUserDeletedStories(userId: string, pagination: Pagination, sorting: Sorting) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId, status: 'delete' })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, status: 'delete' }) as Promise<number>,
  ]);

  return [stories, total];
}

export async function getUserArchivedStories(userId: string, pagination: Pagination, sorting: Sorting) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId, status: 'archive' })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, status: 'archive' }) as Promise<number>,
  ]);

  return [stories, total];
}

export async function getProjectStories(
  userId: string,
  projectId: string,
  pagination: Pagination,
  sorting: Sorting
) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId, projectId, status: { $in: ['active', 'draft'] } })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, projectId, status: { $in: ['active', 'draft'] } }) as Promise<number>,
  ]);
  return [stories, total];
}

export async function getProjectDeletedStories(
  userId: string,
  projectId: string,
  pagination: Pagination,
  sorting: Sorting
) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId, projectId, status: 'delete' })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, projectId, status: 'delete' }) as Promise<number>,
  ]);
  return [stories, total];
}

export async function getProjectArchivedStories(
  userId: string,
  projectId: string,
  pagination: Pagination,
  sorting: Sorting
) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId, projectId, status: 'archive' })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, projectId, status: 'archive' }) as Promise<number>,
  ]);
  return [stories, total];
}

//TODO: Bulk Delete, Restore, Archive, Unarchive can be implemented in future

//TODO: 31/01/2026 Implement hard time limit for Story based on permissions

export async function createStory(userId: string, projectId: string, payload: CreateStoryInput) {
  const story = await StoryModel.create({
    userId,
    projectId,
    title: payload.title,
    description: payload.description,
    timeLimit: payload.timeLimit,
    platform: payload.platform,
    intent: payload.intent,
    status: payload.status,
  });
  return story;
}

export async function getStoryById(userId: string, storyId: string) {
  const story = await validateStoryOwnership(userId, storyId);
  return story;
}

export async function addStoryContextService(
  userId: string,
  storyId: string,
  context: AddStoryContextInput['context']
) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);
    assertStoryIsActive(story);

    const narrationProfile = NARRATION_PROFILES[context.genre as GenreType];

    const oldContext = await ContextProfileModel.findById(story.contextProfileId).session(session);

    let comparison = false;

    if (oldContext) {
      comparison = isSameContextContract(oldContext, context);
    }

    if (comparison) {
      throw new ConflictError('The new context is identical to the current one.');
    }

    const [newContext] = await ContextProfileModel.create(
      [
        {
          userId,
          projectId: story.projectId,
          name: context.name,
          description: context.description,
          genre: context.genre,
          mood: context.mood,
          style: context.style,
          narrativeScope: context.narrativeScope,
          parentContextId: oldContext?._id,
          characters: context.characters,
          environment: context.environment,
          worldRules: context.worldRules,
          narrativeConstraints: context.narrativeConstraints,
          forbiddenElements: context.forbiddenElements,
          narrationProfile,
          scope: ContextScope.PROJECT,
          isDefaultForProject: false,
          lastUsedAt: new Date(),
        },
      ],
      { session }
    );

    story.contextProfileId = newContext._id;
    await story.save({ session });

    return {
      story,
      contextMeta: {
        id: newContext._id.toString(),
        scope: newContext.scope,
        createdAt: newContext.createdAt,
      },
      contextPayload: newContext,
    };
  });
}

export async function setStoryContextService(userId: string, storyId: string, payload: SetStoryContextInput) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);
    assertStoryIsActive(story);

    const project = await ProjectModel.findById(story.projectId).session(session);
    if (!project) throw new NotFoundError("Story's Project not found");

    if (payload.mode === 'use-project') {
      if (!project.defaultContextProfileId) {
        throw new NotFoundError('Project does not have a default context profile set');
      }
      if (
        project.defaultContextProfileId &&
        story.contextProfileId?.equals(project.defaultContextProfileId)
      ) {
        throw new ConflictError('Story is already using the project default context');
      }

      story.contextProfileId = project.defaultContextProfileId;
      await story.save({ session });

      const context = await ContextProfileModel.findById(project.defaultContextProfileId).session(session);
      if (!context) {
        throw new NotFoundError('Context profile not found');
      }

      return {
        story,
        contextMeta: {
          id: context._id.toString(),
          scope: context.scope,
          createdAt: context.createdAt,
        },
      };
    }

    if (payload.mode === 'use-global') {
      const globalContext = await ContextProfileModel.findOne({
        _id: payload.globalContextId,
        scope: ContextScope.GLOBAL,
        active: true,
      }).session(session);

      if (!globalContext) {
        throw new NotFoundError('Global context not found');
      }

      if (story.contextProfileId?.equals(globalContext._id)) {
        throw new ConflictError('Story is already using this global context');
      }

      story.contextProfileId = globalContext._id;
      await story.save({ session });

      return {
        story,
        contextMeta: {
          id: globalContext._id.toString(),
          scope: globalContext.scope,
          createdAt: globalContext.createdAt,
        },
      };
    }
    throw new ConflictError('Invalid story context mode');
  });
}

export async function writeContent(
  userId: string,
  storyId: string,
  payload: {
    content: string;
    summary: string;
    keywords?: string[];
    tags?: string[];
  }
) {
  const story = await validateStoryOwnership(userId, storyId);
  assertStoryIsActive(story);
  const updatedStory = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId },
    {
      $set: {
        content: {
          body: payload.content,
          summary: payload.summary,
          keywords: payload.keywords!,
          tags: payload.tags!,
        },
        authorType: 'user',
        status: 'active',
      },
    },
    { new: true }
  );
  return updatedStory;
}

export async function generateStory(userId: string, storyId: string) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);
    const contextProfile = await ContextProfileModel.findById(story.contextProfileId).session(session);

    const prompt = generateStoryPrompt({
      title: story.title,
      description: story.description,
      intent: story.intent,
      platform: story.platform,
      timeLimit: story.timeLimit,
      contextProfile: contextProfile,
    });

    // put this AI generation service in a different location which also have quality level understanding and control
    let response;
    try {
      response = await openRouterAI(prompt);
    } catch (err) {
      throw new ConflictError('AI generation failed, please try again.');
    }
    const rawcontent = response.choices[0].message?.content || '';
    if (!rawcontent) {
      throw new ConflictError('AI generation returned empty content, please try again.');
    }
    const content = safeParseJSON(rawcontent);
    // Consume credits to be implemented here

      // TODO: Consume credits to be implemented here
      // await consumeCredits(userId, 'story_generation', session);
    const updatedStory = await StoryModel.findOneAndUpdate(
      { _id: storyId, userId },
      {
        $set: {
          content: {
            body: content.story,
            summary: content.summary,
            keywords: content.keywords || [],
            tags: content.tags || [],
          },
          authorType: 'ai',
          status: 'active',
        },
      },
      { new: true, runValidators: true, session }
    );
    return updatedStory;
  });
}

export async function regenerateStory(userId: string, storyId: string, extraPrompt: RegenerateStoryInput) {
  return withTransaction(async (session) => {
    const story = await validateStoryOwnership(userId, storyId, session);
    if (!extraPrompt || !extraPrompt.prompt) {
      throw new ConflictError('No regeneration prompt provided.');
    }

    const contextProfile = await ContextProfileModel.findById(story.contextProfileId).session(session);

    const prompt = generateStoryRegenerationPrompt({
      title: story.title,
      description: story.description,
      existingSummary: story.content.summary,
      intent: story.intent,
      platform: story.platform,
      timeLimit: story.timeLimit,
      extraPrompt: extraPrompt.prompt,
      contextProfile: contextProfile,
    });
    let response;
    try {
      response = await openRouterAI(prompt);
    } catch (err) {
      throw new ConflictError('AI regeneration failed, please try again.');
    }
    const rawcontent = response.choices[0].message?.content || '';
    if (!rawcontent) {
      throw new ConflictError('AI regeneration returned empty content, please try again.');
    }
    const content = safeParseJSON(rawcontent);

    const updatedStory = await StoryModel.findOneAndUpdate(
      { _id: storyId, userId },
      {
        $set: {
          content: {
            body: content.story,
            summary: content.summary,
            keywords: content.keywords || [],
            tags: content.tags || [],
          },
          authorType: 'ai',
        },
      },
      {
        new: true,
        runValidators: true,
        session,
      }
    );
    return updatedStory;
  });
}

export async function updateStory(userId: string, storyId: string, payload: Partial<CreateStoryInput>) {
  await validateStoryOwnership(userId, storyId);

  const updatedStory = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId },
    { $set: payload },
    { new: true }
  );

  // TODO: In future can give hard rule of creating a new story content after main story outline change except title

  return updatedStory;
}

export async function softdeleteStory(userId: string, storyId: string): Promise<boolean> {
  const story = await validateStoryOwnership(userId, storyId);
  assertStoryNotDeleted(story);
  const result = await StoryModel.updateOne(
    { _id: storyId, userId, status: { $ne: 'delete' } },
    { $set: { isDeleted: true, deletedAt: new Date(), status: 'delete' } }
  );
  return result.modifiedCount > 0;
}

export async function restoreStory(userId: string, storyId: string) {
  const story = await validateStoryOwnership(userId, storyId);
  assertStoryIsDeleted(story);
  const updatedStory = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId, status: 'delete' },
    { $set: { isDeleted: false, status: 'active' }, $unset: { deletedAt: '' } },
    { new: true, lean: true }
  );
  return updatedStory;
}

export async function permanentDeleteStory(userId: string, storyId: string): Promise<boolean> {
  const story = await validateStoryOwnership(userId, storyId);
  assertStoryIsDeleted(story);
  const result = await StoryModel.deleteOne({ _id: storyId, userId, status: 'delete' });
  return result.deletedCount > 0;
}

export async function archiveStory(userId: string, storyId: string) {
  const story = await validateStoryOwnership(userId, storyId);
  assertStoryIsActive(story);
  const updatedStory = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId, status: 'active' },
    { $set: { status: 'archive' } },
    { new: true, lean: true }
  );
  return updatedStory;
}

export async function unarchiveStory(userId: string, storyId: string) {
  const story = await validateStoryOwnership(userId, storyId);
  assertStoryIsActive(story);
  const updatedStory = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId, status: 'archive' },
    { $set: { status: 'active' } },
    { new: true, lean: true }
  );
  return updatedStory;
}

// To be implemented in future
export async function rollbackStory(userId: string, storyId: string) {
  return;
}
