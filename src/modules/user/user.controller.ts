import { UpdateAvatarType, validateBody } from "@validation/user.schema.js";
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
  verifyEmail,
} from "./user.service.js";

export const getProfileController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  console.log("getProfileController userId:", userId);
  if (!userId) {
    throw new Error("User ID not found in request");
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
  const updateData = req.body;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  const updatedUser = await updateProfile(userId, updateData);

  return res.status(200).json({
    id: updatedUser._id,
    email: updatedUser.email,
    username: updatedUser.username,
    displayName: updatedUser.displayName,
    avatarUrl: updatedUser.avatarUrl,
    bio: updatedUser.bio,
    plan: updatedUser.plan,
    emailVerified: updatedUser.emailVerified,
    links: updatedUser.links,
    usage: updatedUser.usage,
  });
};

export const updateAvatarController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const avatarData = (
    req.body as unknown as { validateBody?: UpdateAvatarType }
  ).validateBody!;
  if (!userId) {
    throw new Error(
      "Invariant violation: req.user is missing after auth middleware"
    );
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
    throw new Error(
      "Invariant violation: req.user is missing after auth middleware"
    );
  }
  await deleteAvatar(userId);
  return res.status(204).send({
    message: "Avatar deleted successfully",
  });
};

export const getSettingsController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new Error(
      "Invariant violation: req.user is missing after auth middleware"
    );
  }
  const user = await getSettings(userId);
  return res.status(200).json(user);
};

export const getSecurityController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    return new Error(
      "Invariant violation: req.user is missing after auth middleware"
    );
  }
  const user = await getSecurity(userId);

  return res.status(200).json(user);
};

export const getSessionsController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const sessionId = req.sessionId;
  if (!userId || !sessionId) {
    throw new Error(
      "Invariant violation: req.user is missing after auth middleware"
    );
  }
  const sessions = await getSessions(userId, sessionId);
  return res.status(200).json(sessions);
};

export const getBillingController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new Error(
      "Invariant violation: req.user is missing after auth middleware"
    );
  }

  const billingInfo = await getBilling(userId);
  return res.status(200).json(billingInfo);
};

export const updateNotificationsController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user?._id;
  const notificationPrefs = req.body;
  if (!userId) {
    throw new Error("User ID not found in request");
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
  const privacyPrefs = req.body;
  if (!userId) {
    return new Error("User ID not found in request");
  }
  const updatedUser = await updatePrivacySettings(userId, privacyPrefs);
  return res.status(200).json({
    id: updatedUser._id,
    privacyPrefs: updatedUser.privacyPrefs,
  });
};

export const updatePasswordController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { currentPassword, newPassword } = req.body;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  await updatePassword(userId, currentPassword, newPassword);
  return res.status(200).json({
    message: "Password updated successfully",
  });
};

export const updateEmailController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { newEmail } = req.body;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  const updatedUser = await updateEmail(userId, newEmail);
  return res.status(200).json(updatedUser);
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const method: string = req.body.method;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  // Implementation for verifying email
  const result = await verifyEmail(userId, method);
  return res.status(200).json(result);
};

export const deleteSessionController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { sessionId } = req.params;
  const currentSession = req.sessionId;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  if (currentSession === sessionId) {
    return res
      .status(400)
      .json({ message: "Cannot delete current active session" });
  }
  await deleteSession(userId, sessionId);
  return res.status(204).send();
};

export const deleteAllSessionsController = async (
  req: Request,
  res: Response
) => {
  const removeCurrent = req.body.removeCurrent || false;
  const userId = req.user?._id;
  const currentSession = req.sessionId;

  if (!userId) {
    throw new Error("User ID not found in request");
  }
  if (!currentSession) {
    throw new Error("Session ID not found in request");
  }
  await deleteAllSessions(userId, currentSession, removeCurrent);
  return res.status(204).send();
};

export const deleteAccountController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  // Implementation for deleting user account
  await deleteAccount(userId);
  return res.status(204).send();
};

export const updateAccountController = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const updateData = req.body;
  if (!userId) {
    throw new Error("User ID not found in request");
  }
  // Implementation for updating user account - the main thing her is to update accountStatus other than deleted

  const updatedUser = await updateAccount(userId, updateData);

  return res.status(200).json({
    message: "Account updated successfully",
    user: updatedUser,
  });
};
