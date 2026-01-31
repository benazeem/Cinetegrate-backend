import { ClientSession } from 'mongoose';
import { StoryModel } from '@models/Story.js';
import { NotFoundError } from '@middleware/error/index.js';
import { Story } from '@models/Story.js';

export async function validateStoryOwnership(
  userId: string,
  storyId: string,
  session?: ClientSession
): Promise<Story> {
  const query = StoryModel.findOne({
    _id: storyId,
    userId,
  });

  if (session) {
    query.session(session);
  }

  const story = await query;
  if (!story) {
    throw new NotFoundError('Story not found or access denied');
  }

  return story;
}
