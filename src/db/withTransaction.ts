import mongoose, { ClientSession } from 'mongoose';

type TransactionCallback<T> = (session: ClientSession) => Promise<T>;

/**
 * Executes the given callback inside a MongoDB transaction.
 * - Always commits on success
 * - Always aborts on error
 * - Always ends the session
 *
 * No retries. No swallowing errors. No side effects here.
 */
export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
