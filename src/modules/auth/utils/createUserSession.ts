import { generateAllCookieTokens } from "@utils/generateAllCookieTokens.js";
import { getIpInfo } from "@utils/getIpInfo.js";
import { parseUserAgent } from "@utils/parseUserAgent.js";
import { hashToken } from "@utils/tokens.js";
import crypto from "crypto";
import { User } from "@models/User.js";

export async function createUserSession({
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

  const sessionId = crypto.randomBytes(32).toString("hex");

  const { accessToken, refreshToken, csrfToken } = generateAllCookieTokens(
    user._id,
    sessionId,
    user.role,
    user.accountStatus
  );

  const sessionPayload = {
    sessionId,
    userId: user._id,
    userAgent,
    device: userAgentInfo.device,
    browser: userAgentInfo.browser,
    os: userAgentInfo.os,
    ip: ipData.ip,
    city: ipData.cityName,
    country: ipData.countryName,
    timezone: ipData.timeZones[0],
    lat: ipData.latitude,
    lng: ipData.longitude,
    isp: ipData.asnOrganization,
    refreshTokenHash: hashToken(refreshToken),
    csrfTokenHash: hashToken(csrfToken),
    expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };

  return {
    sessionPayload,
    tokens: { accessToken, refreshToken, csrfToken },
  };
}
