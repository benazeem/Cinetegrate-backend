import { Types } from "mongoose";
import { generateAccessToken, generateCsrfToken, generateRefreshToken } from "./tokens.js";
import { AccountStatus } from "@constants/userConts.js";

export const generateAllCookieTokens = (userId:Types.ObjectId, sessionId:string, role:string, accountStatus:AccountStatus) => {
 const accessToken = generateAccessToken(userId, sessionId, role, accountStatus);
     const refreshToken = generateRefreshToken(userId, sessionId);
     const csrfToken = generateCsrfToken();
        return { accessToken, refreshToken, csrfToken };
}