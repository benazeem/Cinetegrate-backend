import {
  DeleteAllSessionsType,
  DeleteSessionParamsType,
  UpdateEmailType,
  UpdateNotificationsType,
  UpdatePasswordType,
  UpdatePrivacySettingsType,
  UpdateProfileType,
} from "@validation/user.schema.js";
import type { NextFunction, Request, Response } from "express";
import {
  deactivateAccount,
  deleteAccount,
  deleteAllSessions,
  deleteAvatar,
  deleteSession,
  getBilling,
  getProfile,
  getSecurity,
  getSessions,
  getSettings,
  reactivateAccount,
  updateAvatar,
  updateEmail,
  updateNotifications,
  updatePassword,
  updatePrivacySettings,
  updateProfile,
} from "./user.service.js";

export const getProfileController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
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
  const userId = req.user!.id;
  const updateData = req.validatedBody as UpdateProfileType;

  const updatedUser = await updateProfile(userId, updateData);
  return res.status(200).json(updatedUser);
};

export const updateAvatarController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const avatarData = req.file;
  const updatedUser = await updateAvatar(userId, avatarData);
  return res.status(200).json(updatedUser);
};

export const deleteAvatarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.id;
  await deleteAvatar(userId);
  return res.status(204).send({
    message: "Avatar deleted successfully",
  });
};

export const getSettingsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await getSettings(userId);
  return res.status(200).json(user);
};

export const getSecurityController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await getSecurity(userId);
  return res.status(200).json(user);
};

export const getSessionsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessionId = req.sessionId!;
  const sessions = await getSessions(userId, sessionId);
  return res.status(200).json(sessions);
};

export const getBillingController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const billingInfo = await getBilling(userId);
  return res.status(200).json(billingInfo);
};

export const updateNotificationsController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;
  const notificationPrefs = req.validatedBody as UpdateNotificationsType;

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
  const userId = req.user!.id;
  const privacyPrefs = req.validatedBody as UpdatePrivacySettingsType;
  const updatedUser = await updatePrivacySettings(userId, privacyPrefs);
  return res.status(200).json({
    id: updatedUser._id,
    privacyPrefs: updatedUser.privacyPrefs,
  });
};

export const updatePasswordController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } =
    req.validatedBody as UpdatePasswordType;

  // TODO : Ask user if wanted to remove all sessions except current
  await updatePassword(userId, currentPassword, newPassword);
  return res.status(200).json({
    message: "Password updated successfully",
  });
};

export const updateEmailController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { newEmail } = req.validatedBody as UpdateEmailType;

  await updateEmail(userId, newEmail);
  return res.status(200).json({
    message: "Email update initiated. Please verify your new email address.",
  });
};

export const deleteSessionController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sessionId } = req.validatedParams as DeleteSessionParamsType;
  const currentSession = req.sessionId!;
  if (currentSession === sessionId) {
    return res
      .status(400)
      .json({ message: "Cannot delete current active session" });
  }
  await deleteSession(userId, sessionId);
  return res.status(204).json();
};

export const deleteAllSessionsController = async (
  req: Request,
  res: Response
) => {
  const { removeCurrent } = req.validatedBody as DeleteAllSessionsType;
  const userId = req.user!.id;
  const currentSession = req.sessionId!;
  await deleteAllSessions(userId, currentSession, removeCurrent);
  return res.status(204).json();
};

export const deactivateAccountController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;
  await deactivateAccount(userId);

  return res.status(200).json({
    message: "Account deactivated successfully",
  });
};

export const reactivateAccountController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.id;
  const updatedUser = await reactivateAccount(userId);
  return res.status(200).json({
    user: updatedUser,
    message: "Account reactivated successfully",
  });
};

export const deleteAccountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await deleteAccount(userId);
  return res.status(204).json();
};
