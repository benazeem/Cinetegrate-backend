import { NotFoundError } from '@middleware/error/index.js';
import { User, UserModel } from '@models/User.js';
import { ClientSession } from 'mongoose';

export async function validateUser(userId: string, session?: ClientSession): Promise<User> {
  const query = UserModel.findById(userId);
  if (session) query.session(session);
  const user = await query;
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
