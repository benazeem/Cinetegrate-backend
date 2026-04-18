import {
  DeleteAllSessionsType,
  DeleteSessionParamsType,
  UpdateEmailType,
  UpdateNotificationsType,
  UpdatePasswordType,
  UpdatePrivacySettingsType,
  UpdateProfileType,
} from '@validation/user.schema.js';
import type { Request, Response } from 'express';
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
} from './user.service.js';
import { sendSuccess } from '@shared/response.js';
import { BadRequestError, UnauthorizedError } from '@middleware/error/index.js';

export const getProfileController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await getProfile(userId);

  return res.status(200).json({
    message: 'Profile retrieved successfully',
    data: user,
  });
};

export const updateProfileController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const updateData = req.validatedBody as UpdateProfileType;
  const updatedUser = await updateProfile(userId, updateData);
  return sendSuccess(res, updatedUser, 'Profile updated successfully');
};

export const updateAvatarController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const avatarData = req.file;
  const updatedUser = await updateAvatar(userId, avatarData);
  return sendSuccess(res, updatedUser, 'Avatar updated successfully');
};

export const deleteAvatarController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await deleteAvatar(userId);
  return sendSuccess(res, null, 'Avatar deleted successfully');
};

export const getSettingsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await getSettings(userId);
  return sendSuccess(res, user, 'Settings retrieved successfully');
};

export const getSecurityController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await getSecurity(userId);
  return sendSuccess(res, user, 'Security info retrieved successfully');
};

export const getSessionsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessionId = req.sessionId!;
  const sessions = await getSessions(userId, sessionId);
  return sendSuccess(res, sessions, 'Sessions retrieved successfully');
};

export const getBillingController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const billingInfo = await getBilling(userId);
  return sendSuccess(res, billingInfo, 'Billing info retrieved successfully');
};

export const updateNotificationsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notificationPrefs = req.validatedBody as UpdateNotificationsType;
  const updatedUser = await updateNotifications(userId, notificationPrefs);
  return sendSuccess(res, updatedUser, 'Notification preferences updated successfully');
};

export const updatePrivacySettingsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const privacyPrefs = req.validatedBody as UpdatePrivacySettingsType;
  const updatedUser = await updatePrivacySettings(userId, privacyPrefs);
  return sendSuccess(res, updatedUser, 'Privacy settings updated successfully');
};

export const updatePasswordController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.validatedBody as UpdatePasswordType;
  await updatePassword(userId, currentPassword, newPassword);
  return sendSuccess(res, null, 'Password updated successfully');
};

export const updateEmailController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { newEmail } = req.validatedBody as UpdateEmailType;
  await updateEmail(userId, newEmail);
  return sendSuccess(res, null, 'Email update initiated. Please verify your new email address.');
};

export const deleteSessionController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sessionId } = req.validatedParams as DeleteSessionParamsType;
  const currentSession = req.sessionId!;

  if (currentSession === sessionId) {
    throw new BadRequestError('Cannot delete current active session');
  }

  await deleteSession(userId, sessionId);
  return sendSuccess(res, null, 'Session deleted successfully');
};

export const deleteAllSessionsController = async (req: Request, res: Response) => {
  const { removeCurrent } = req.validatedBody as DeleteAllSessionsType;
  const userId = req.user!.id;
  const currentSession = req.sessionId!;
  await deleteAllSessions(userId, currentSession, removeCurrent);
  return sendSuccess(res, null, 'All sessions deleted successfully');
};

export const deactivateAccountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await deactivateAccount(userId);
  return sendSuccess(res, null, 'Account deactivated successfully');
};

export const reactivateAccountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const updatedUser = await reactivateAccount(userId);
  return sendSuccess(res, updatedUser, 'Account reactivated successfully');
};

export const deleteAccountController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await deleteAccount(userId);
  return sendSuccess(res, null, 'Account deleted successfully');
};
