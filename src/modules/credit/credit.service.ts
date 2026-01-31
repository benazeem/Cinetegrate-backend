import mongoose, { Types } from 'mongoose';
import { CreditsModel } from '@models/Credits.js';
import { ForbiddenError, InternalServerError } from '@middleware/error/index.js';

export async function getAvailableCredits(userId: Types.ObjectId): Promise<number> {
  const rows = await CreditsModel.find({
    userId,
    isExpired: false,
    $or: [{ validTill: null }, { validTill: { $gt: new Date() } }],
  });

  let total = 0;
  for (const row of rows) {
    total += Math.max(0, row.creditsGranted - row.creditsUsed);
  }
  return total;
}

export async function consumeCredits(
  userId: Types.ObjectId,
  amount: number,
  session: mongoose.ClientSession
): Promise<void> {
  if (amount <= 0) return;

  try {
    const creditEntries = await CreditsModel.find(
      {
        userId,
        isExpired: false,
        $or: [{ validTill: null }, { validTill: { $gt: new Date() } }],
      },
      null,
      { session }
    ).sort({ validTill: 1, createdAt: 1 });

    let creditsToConsume = amount;

    for (const entry of creditEntries) {
      if (creditsToConsume === 0) break;

      const available = entry.creditsGranted - entry.creditsUsed;
      if (available <= 0) continue;

      const usedNow = Math.min(available, creditsToConsume);

      entry.creditsUsed += usedNow;
      creditsToConsume -= usedNow;

      await entry.save({ session });
    }

    // 3. If not enough credits → rollback
    if (creditsToConsume > 0) {
      throw new ForbiddenError('Insufficient credits');
    }
  } catch (err) {
    throw err instanceof ForbiddenError
      ? err
      : new InternalServerError('Credit consumption failed', String(err));
  }
}
