import { NotFoundError } from '@middleware/error/index.js';
import { StoryNarration, StoryNarrationModel } from '@models/Narration.js';
import { ClientSession } from 'mongoose';

export async function validateNarrationOwnership(
  userId: string,
  narrationId: string,
  session?: ClientSession
): Promise<StoryNarration> {
  const query = StoryNarrationModel.findOne({
    _id: narrationId,
    userId,
  });

  if (session) query.session(session);

  const narration = await query;
  if (!narration) {
    throw new NotFoundError('Narration not found or access denied');
  }
  return narration;
}
