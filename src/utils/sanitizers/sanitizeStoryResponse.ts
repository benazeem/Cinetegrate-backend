import type { SanitizedStory } from '@app-types/Story.js';
import type { Story } from '@models/Story.js';

export type { SanitizedStory };

/**
 * Sanitizes a Story document — never exposes userId.
 */
export function sanitizeStoryResponse(story: Story): SanitizedStory {
  return {
    id: story._id.toString(),
    projectId: story.projectId?.toString(),
    contextProfileId: story.contextProfileId?.toString() ?? null,
    title: story.title,
    description: story.description,
    platform: story.platform,
    intent: story.intent,
    timeLimit: story.timeLimit,
    status: story.status,
    content: story.content
      ? {
          body: story.content.body,
          summary: story.content.summary,
          keywords: story.content.keywords,
          tags: story.content.tags,
          authorType: story.content.authorType,
          contentStatus: story.content.contentStatus,
        }
      : undefined,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
}

export function sanitizeStoriesResponse(stories: Story[]): SanitizedStory[] {
  return stories.map(sanitizeStoryResponse);
}
