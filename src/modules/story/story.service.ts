 import { ConflictError, NotFoundError } from "@middleware/error/index.js";
import {
  ContextProfileModel,
  ContextScope,
  GenreType,
} from "@models/ContextProfile.js";
import { ProjectModel } from "@models/Project.js";
import { StoryModel } from "@models/Story.js";
import safeParseJSON from "@utils/safeParseJSON.js";
import {
  CreateStoryInput,
  RegenerateStoryInput,
} from "@validation/story.schema.js";
import { NARRATION_PROFILES } from "constants/narrationProfiles.js";
import { openRouterAI } from "libs/ai/clients/openAI.js";
import { generateStoryPrompt } from "@libs/ai/prompts/generateStoryPrompt.js";
import { generateStoryRegenerationPrompt } from "libs/ai/prompts/generateStoryRegenerationPrompt.js";
import mongoose from "mongoose";
import { Pagination, Sorting } from "types/Pagination.js"; 

export async function getUserStories(
  userId: string,
  pagination: Pagination,
  sorting: Sorting
) {
  const [stories, total] = await Promise.all([
    StoryModel.find({ userId })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId }) as Promise<number>,
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
    StoryModel.find({ userId, projectId })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ [sorting.sortBy]: sorting.sortOrder }),
    StoryModel.countDocuments({ userId, projectId }) as Promise<number>,
  ]);
  return [stories, total];
}

export async function createStory(
  userId: string,
  projectId: string,
  payload: CreateStoryInput
) {
  const story = await StoryModel.create({
    userId,
    projectId,
    title: payload.title,
    description: payload.description,
    timeLimit: payload.timeLimit,
    platform: payload.platform,
    intent: payload.intent,
    status: "draft",
  });
  return story;
}

export async function getStoryById(userId: string, storyId: string) {
  const story = await StoryModel.findOne({ _id: storyId, userId });
  if (!story) {
    throw new NotFoundError("Story not found");
  }
  return story;
}

export async function addStoryContextService(
  userId: string,
  storyId: string,
  payload: any
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const story = await StoryModel.findOne({
      _id: storyId,
      userId,
    }).session(session);
    if (!story) throw new NotFoundError("Story not found");

    const narrationProfile =
      NARRATION_PROFILES[payload.data.genre as GenreType];
    const [newContext] = await ContextProfileModel.create(
      [
        {
          userId,
          name: payload.data.name,
          description: payload.data.description,
          genre: payload.data.genre,
          mood: payload.data.mood,
          style: payload.data.style,
          environment: payload.data.environment,
          worldRules: payload.data.worldRules,
          narrativeConstraints: payload.data.narrativeConstraints,
          narrationProfile,
          scope: ContextScope.GLOBAL,
          isDefaultForProject: false,
          lastUsedAt: new Date(),
        },
      ],
      { session }
    );

    story.contextProfileId = newContext._id;
    await story.save({ session });

    await session.commitTransaction();
    return {
      story,
      contextMeta: {
        id: newContext._id.toString(),
        scope: newContext.scope,
        createdAt: newContext.createdAt,
      },
      contextPayload: newContext,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function setStoryContextService(
  userId: string,
  storyId: string,
  payload: any
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const story = await StoryModel.findOne({
      _id: storyId,
      userId,
    }).session(session);

    if (!story) throw new NotFoundError("Story not found");

    const project = await ProjectModel.findById(story.projectId).session(
      session
    );
    if (!project) throw new NotFoundError("Project not found");

    if (payload.mode === "use-project") {
      if (!project.defaultContextProfileId) {
        throw new NotFoundError("Project has no default context");
      }

      story.contextProfileId = project.defaultContextProfileId;
      await story.save({ session });

      const context = await ContextProfileModel.findById(
        project.defaultContextProfileId
      ).session(session);
      if (!context) {
        throw new NotFoundError("Context profile not found");
      }

      await session.commitTransaction();
      return {
        story,
        contextMeta: {
          id: context._id.toString(),
          scope: context.scope,
          createdAt: context.createdAt,
        },
      };
    }

    if (payload.mode === "use-global") {
      const globalContext = await ContextProfileModel.findOne({
        _id: payload.globalContextId,
        scope: ContextScope.GLOBAL,
        active: true,
      }).session(session);

      if (!globalContext) {
        throw new NotFoundError("Global context not found");
      }

      story.contextProfileId = globalContext._id;
      await story.save({ session });

      await session.commitTransaction();
      return {
        story,
        contextMeta: {
          id: globalContext._id.toString(),
          scope: globalContext.scope,
          createdAt: globalContext.createdAt,
        },
      };
    }
    throw new Error("Invalid story context mode");
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
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
  const story = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId },
    {
      $set: {
        content: {
          body: payload.content,
          summary: payload.summary,
          keywords: payload.keywords!,
          tags: payload.tags!,
        },
        authorType: "user",
        status: "active",
      },
    },
    { new: true }
  );
  if (!story) {
    throw new NotFoundError("Story not found or not authorized");
  }
  return story;
}

export async function generateStory(userId: string, storyId: string) {
  const story = await StoryModel.findOne({ _id: storyId, userId });
  if (!story) {
    throw new NotFoundError("Story not found");
  }
  const contextProfile = await ContextProfileModel.findById(story.contextProfileId); 

  const prompt =  generateStoryPrompt({
    title: story.title,
    description: story.description,
    intent:story.intent,
    platform: story.platform,
    timeLimit: story.timeLimit,
    contextProfile: contextProfile,
  });
  let response;
  try {
    response = await openRouterAI(prompt);
  } catch (err) {
    throw new ConflictError("AI generation failed, please try again.");
  }
  const rawcontent = response.choices[0].message?.content || "";
  if (!rawcontent) {
    throw new ConflictError(
      "AI generation returned empty content, please try again."
    );
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
        authorType: "ai",
        status: "active",
      },
    },
    { new: true, runValidators: true }
  ); 

  return updatedStory;
}

export async function regenerateStory(
  userId: string,
  storyId: string,
  extraPrompt: RegenerateStoryInput
) {
  const story = await StoryModel.findOne({ _id: storyId, userId });
  if (!story) {
    throw new NotFoundError("Story not found");
  }
  if (!extraPrompt || !extraPrompt.prompt) {
    throw new ConflictError("No regeneration prompt provided.");
  }

  const contextProfile = await ContextProfileModel.findById(story.contextProfileId);
  
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
    throw new ConflictError("AI regeneration failed, please try again.");
  }
  const rawcontent = response.choices[0].message?.content || "";
  if (!rawcontent) {
    throw new ConflictError(
      "AI regeneration returned empty content, please try again."
    );
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
        authorType: "ai",
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ); 
  return updatedStory;
}

export async function updateStory(
  userId: string,
  storyId: string,
  payload: Partial<CreateStoryInput>
) {
  const story = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId },
    { $set: payload },
    { new: true }
  );

  // TODO: In future can give hard rule of creating a new story content after main story outline change except title
  if (!story) {
    throw new NotFoundError("Story not found or not authorized");
  }
  return story;
}

export async function deleteStory(
  userId: string,
  storyId: string
): Promise<boolean> {
  const story = await StoryModel.findOne({ _id: storyId, userId });
  if (!story) {
    throw new NotFoundError("Story not found");
  }
  if (story.status === "delete") {
    throw new ConflictError("Story is already deleted");
  }
  const result = await StoryModel.updateOne(
    { _id: storyId, userId, status: { $ne: "delete" } },
    { $set: { isDeleted: true, deletedAt: new Date(), status: "delete" } }
  );
  return result.modifiedCount > 0;
}

export async function restoreStory(userId: string, storyId: string) {
  const story = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId, status: "delete" },
    { $set: { isDeleted: false, status: "active" }, $unset: { deletedAt: "" } },
    { new: true, lean: true }
  );
  if (!story) {
    throw new NotFoundError("Story not found or not deleted");
  }
  return story;
}

export async function archiveStory(userId: string, storyId: string) {
  const story = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId, status: "active" },
    { $set: { status: "archive" } },
    { new: true, lean: true }
  );
  if (!story) {
    throw new NotFoundError("Story not found or not active");
  }
  return story;
}

export async function unarchiveStory(userId: string, storyId: string) {
  const story = await StoryModel.findOneAndUpdate(
    { _id: storyId, userId, status: "archive" },
    { $set: { status: "active" } },
    { new: true, lean: true }
  );
  if (!story) {
    throw new NotFoundError("Story not found or not archived");
  }
  return story;
}

// To be implemented
export async function rollbackStory(userId: string, storyId: string) {
  return;
}