import { SessionData } from '../../../models/Session.js';
import { generateAllCookieTokens } from '@utils/generateAllCookieTokens.js';
import { getIpInfo } from '@utils/getIpInfo.js';
import { parseUserAgent } from '@utils/parseUserAgent.js';
import { hashToken } from '@utils/tokens.js';
import crypto from 'crypto';
import { User } from '@models/User.js';

export async function createSessionPayload({
  user,
  userAgent,
  ip,
}: {
  user: User;
  userAgent: string;
  ip: string;
}) {
  const ipData: any = await getIpInfo(ip);
  const userAgentInfo = parseUserAgent(userAgent);
  const sessionId = crypto.randomBytes(32).toString('hex');
  const { accessToken, refreshToken, csrfToken } = generateAllCookieTokens(
    user._id,
    sessionId,
    user.role,
    user.accountStatus
  );

  let sessionPayload: Partial<SessionData> = {
    sessionId,
    userId: user._id,
    userAgent,
    device: userAgentInfo.device,
    browser: userAgentInfo.browser,
    os: userAgentInfo.os,
    refreshTokenHash: hashToken(refreshToken),
    expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lastUsedAt: new Date(),
  };

  if (ipData.success) {
    sessionPayload = {
      ...sessionPayload,
      ip: ipData.ip,
      city: ipData.cityName,
      country: ipData.countryName,
      timezone: ipData.timeZones[0] || 'unknown',
      lat: ipData.latitude,
      lng: ipData.longitude,
      isp: ipData.asnOrganization,
    };
  }

  return {
    sessionPayload,
    tokens: { accessToken, refreshToken, csrfToken },
  };
}
