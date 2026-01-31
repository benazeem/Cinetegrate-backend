import { Types } from 'mongoose';
import { UserModel } from '@models/User.js';
import { PlanModel } from '@models/Plan.js';
import { UserCapabilityOverrideModel } from '@models/CapabilityOverride.js';
import { ForbiddenError, InternalServerError } from '@middleware/error/index.js';
import { ActionType } from 'config/creditPricing.js';
import { resolveEffectiveCapabilities } from '@modules/featurePermission/utils/resolveEffectiveCapabilities.js';

type PermissionInput = {
  userId: Types.ObjectId;
  action: ActionType;
  grade: number;
};

export async function assertFeaturePermission({ userId, action, grade }: PermissionInput): Promise<void> {
  const user = await UserModel.findById(userId).lean();
  if (!user || !user.currentPlan) {
    throw new InternalServerError('User or plan not found');
  }

  const plan = await PlanModel.findById(user.currentPlan).lean();
  if (!plan || !plan.isActive || !plan.capabilities) {
    throw new ForbiddenError('Plan is inactive or invalid');
  }

  const now = new Date();
  const overrides = await UserCapabilityOverrideModel.find({
    userId,
    validFrom: { $lte: now },
    validTill: { $gt: now },
  }).lean();

  const caps = resolveEffectiveCapabilities(plan.capabilities, overrides);

  switch (action) {
    case 'IMAGE_GEN':
      if (!caps.image || grade > caps.image.maxTier) {
        throw new ForbiddenError('Image generation grade not allowed');
      }
      return;

    case 'AUDIO_GEN':
      if (!caps.audio || grade > caps.audio.maxTier) {
        throw new ForbiddenError('Audio generation grade not allowed');
      }
      return;

    case 'STORY_GEN':
      if (!caps.story || grade > caps.story.maxTier) {
        throw new ForbiddenError('Story generation grade not allowed');
      }
      return;

    case 'VIDEO_GEN':
      if (!caps.video || !caps.video.enabled) {
        throw new ForbiddenError('Video generation not allowed');
      }
      if (grade > caps.video.maxSeconds) {
        throw new ForbiddenError('Video request exceeds plan limit');
      }
      return;

    default:
      throw new InternalServerError(`Unknown action: ${action}`);
  }
}
