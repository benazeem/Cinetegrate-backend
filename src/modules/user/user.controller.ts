import {
  DeleteAllSessionsType,
  DeleteSessionParamsType,
  UpdateAccountType,
  UpdateAvatarType,
  UpdateEmailType,
  UpdateNotificationsType,
  UpdatePasswordType,
  UpdatePrivacySettingsType,
  UpdateProfileType,
} from "@validation/user.schema.js";
import type { NextFunction, Request, Response } from "express";
import {
  deleteAccount,
  deleteAllSessions,
  deleteAvatar,
  deleteSession,
  getBilling,
  getProfile,
  getSecurity,
  getSessions,
  getSettings,
  updateAccount,
  updateAvatar,
  updateEmail,
  updateNotifications,
  updatePassword,
  updatePrivacySettings,
  updateProfile,
} from "./user.service.js";
import { AccountStatus } from "constants/accountStatus.js";
import {
  NotFoundError,
  UnauthenticatedError,
} from "@middleware/error/index.js";

export const getProfileController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  const user = await getProfile(userId);

  return res.status(200).json({
    id: user._id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    plan: user.plan,
    emailVerified: user.emailVerified,
    links: user.links,
    usage: user.usage,
  });
};

export const updateProfileController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const updateData = (req as unknown as { validatedBody?: UpdateProfileType })
    .validatedBody!;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }

  const updatedUser = await updateProfile(userId, updateData);

  return res.status(200).json(updatedUser);
};

export const updateAvatarController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const avatarData = req.file;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  if (!avatarData) {
    throw new NotFoundError("Avatar file not found");
  }
 
  const updatedUser = await updateAvatar(userId, avatarData);
  return res.status(200).json(updatedUser);

  // Implementation for updating user avatar
};

export const deleteAvatarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  await deleteAvatar(userId);
  return res.status(204).send({
    message: "Avatar deleted successfully",
  });
};

export const getSettingsController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  const user = await getSettings(userId);
  return res.status(200).json(user);
};

export const getSecurityController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  const user = await getSecurity(userId);

  return res.status(200).json(user);
};

export const getSessionsController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const sessionId = req.sessionId;
  if (!userId || !sessionId) {
    throw new UnauthenticatedError("Authentication required");
  }
  const sessions = await getSessions(userId, sessionId);
  return res.status(200).json(sessions);
};

export const getBillingController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }

  const billingInfo = await getBilling(userId);
  return res.status(200).json(billingInfo);
};

export const updateNotificationsController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user?._id;
  const notificationPrefs = (
    req as unknown as { validatedBody?: UpdateNotificationsType }
  ).validatedBody!;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  // Assuming updateNotifications is a service function to update notification preferences
  const updatedUser = await updateNotifications(userId, notificationPrefs);

  return res.status(200).json({
    id: updatedUser._id,
    notificationPrefs: updatedUser.notificationPrefs,
  });
};

export const updatePrivacySettingsController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user?._id;
  const privacyPrefs = (
    req as unknown as { validatedBody?: UpdatePrivacySettingsType }
  ).validatedBody!;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  const updatedUser = await updatePrivacySettings(userId, privacyPrefs);
  return res.status(200).json({
    id: updatedUser._id,
    privacyPrefs: updatedUser.privacyPrefs,
  });
};

export const updatePasswordController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { currentPassword, newPassword } = (
    req as unknown as { validatedBody?: UpdatePasswordType }
  ).validatedBody!;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  // TODO : Ask user if wanted to remove all sessions except current
  await updatePassword(userId, currentPassword, newPassword);
  return res.status(200).json({
    message: "Password updated successfully",
  });
};

export const updateEmailController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { newEmail } = (req as unknown as { validatedBody?: UpdateEmailType })
    .validatedBody!;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  await updateEmail(userId, newEmail);
  return res.status(200).json({
    message: "Email update initiated. Please verify your new email address.",
  });
};

export const deleteSessionController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { sessionId } = (
    req as unknown as { validatedParams?: DeleteSessionParamsType }
  ).validatedParams!;
  const currentSession = req.sessionId;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  if (currentSession === sessionId) {
    return res
      .status(400)
      .json({ message: "Cannot delete current active session" });
  }
  await deleteSession(userId, sessionId);
  return res.status(204).send({
    message: "Session deleted successfully",
  });
};

export const deleteAllSessionsController = async (
  req: Request,
  res: Response
) => {
  const { removeCurrent } = (
    req as unknown as { validatedBody?: DeleteAllSessionsType }
  ).validatedBody!;
  const userId = req.user?._id;
  const currentSession = req.sessionId;

  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  if (!currentSession) {
    throw new UnauthenticatedError("Authentication required");
  }
  await deleteAllSessions(userId, currentSession, removeCurrent);
  return res.status(204).send();
};

export const deleteAccountController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  // Implementation for deleting user account
  await deleteAccount(userId);
  return res.status(204).send();
};

export const updateAccountController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const sessionId = req.sessionId;
  const { accountStatus } = (
    req as unknown as { validatedBody?: UpdateAccountType }
  ).validatedBody!;
  if (!userId) {
    throw new UnauthenticatedError("Authentication required");
  }
  if (!sessionId) {
    throw new UnauthenticatedError("Authentication required");
  }
  const updatedUser = await updateAccount(userId, accountStatus, sessionId);

  return res.status(200).json({
    message: "Account updated successfully",
    user: updatedUser,
  });
};
