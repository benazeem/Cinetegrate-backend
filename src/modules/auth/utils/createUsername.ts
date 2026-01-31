import crypto from 'crypto';
import { UserModel } from '@models/User.js';
import { ClientSession } from 'mongoose';

export const createUsername = async (email: string, session: ClientSession): Promise<string> => {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Fallback if base becomes empty
  const root = base || 'user';

  // Retry up to 10 times before failing
  for (let i = 0; i < 10; i++) {
    const suffix = crypto.randomBytes(3).toString('hex'); // 6 hex chars
    const username = `${root}${suffix}`;

    const exists = await UserModel.exists({ username }).session(session);
    if (!exists) return username;
  }

  // If all 10 attempts failed (extremely rare), use a timestamp fallback
  return `${root}${Date.now().toString(36)}`;
};
