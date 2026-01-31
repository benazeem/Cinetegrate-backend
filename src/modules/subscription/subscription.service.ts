import mongoose, { Types } from 'mongoose';
import { UserModel } from '@models/User.js';
import { PlanModel } from '@models/Plan.js';
import { CreditsModel } from '@models/Credits.js';
import { InternalServerError } from '@middleware/error/index.js';

export async function assignFreePlan(userId: Types.ObjectId, session: mongoose.ClientSession): Promise<void> {
  const user = await UserModel.findById(userId).session(session);
  if (!user) {
    throw new InternalServerError('User not found while assigning free plan');
  }

  if (user.currentPlan) return;

  const freePlan = await PlanModel.findOne({
    key: 'free',
    isActive: true,
  }).session(session);

  if (!freePlan) {
    throw new InternalServerError('Free plan missing from database');
  }

  user.currentPlan = freePlan._id;
  user.planStartedAt = new Date();
  user.planEndsAt = null;

  await user.save({ session });

  await CreditsModel.create(
    [
      {
        userId: user._id,
        planKey: freePlan.key,
        source: 'free_plan',
        creditType: 'ai',
        creditsGranted: freePlan.creditGrantAmount,
        creditsUsed: 0,
        validFrom: new Date(),
        validTill: null,
      },
    ],
    { session }
  );
}
