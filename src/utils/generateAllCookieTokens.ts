import { Types } from 'mongoose';
import { generateAccessToken, generateRefreshToken } from './tokens.js';
import { AccountStatus } from '@constants/userConsts.js';

export const generateAllCookieTokens = (
  userId: Types.ObjectId,
  sessionId: string,
  role: string,
  accountStatus: AccountStatus
) => {
  const accessToken = generateAccessToken(userId, sessionId, role, accountStatus);
  const refreshToken = generateRefreshToken(userId, sessionId);
  return { accessToken, refreshToken };
};
