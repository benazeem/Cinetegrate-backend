import bcrypt from "bcrypt";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
} from "@middleware/error/index.js";
import { SessionModel } from "@models/Session.js";
import { type User, UserModel } from "@models/User.js";
import { returnUserData } from "@utils/returnUserData.js";
import {
  UpdateNotificationsType,
  UpdatePrivacySettingsType,
} from "@validation/user.schema.js";
import mongoose from "mongoose";
import { generateVerificationToken } from "@utils/tokens.js";
import sendUpdateEmailLink from "@utils/emails/sender/sendUpdateEmailLink.js";
import sendOldEmailVerificationForEmailUpdate from "@utils/emails/sender/sendOldEmailVerificationForEmailUpdate.js";

export const getProfile = async (userId: string): Promise<User> => {
  const user = await UserModel.findById(userId)
    .select(
      "-passwordHash -emailVerificationToken -resetPasswordToken -createdAt -updatedAt"
    )
    .catch((err) => {
      throw new InternalServerError(
        "Could not fetch user profile",
        err.message
      );
    });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

export const updateProfile = async (
  userId: string,
  updateData: Partial<User>
): Promise<Partial<User>> => {
  const user = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(user, "profile");
  return resUser;
};

export const updateAvatar = async (
  userId: string,
  avatarData: Express.Multer.File | undefined
): Promise<Partial<User>> => {
  if (!avatarData) {
    throw new BadRequestError("Avatar file not found");
  }
  const { filename, path } = avatarData;

  //TODO: Add logic to move the file from temp to cloud storage like s3 or similar
  // For now, we will just use the filename as is
  const avatarUrl = `${path}/${filename}`;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { avatarUrl: avatarUrl },
    { new: true }
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(user, "profile");
  return resUser;
};

export const deleteAvatar = async (userId: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  /**
   * Retrieves the current avatar URL from the user object before updating it.
   * This variable stores the old avatar URL to enable cleanup of the previous avatar file
   * from cloud storage if a new avatar is uploaded during the update process.
   * If no avatar currently exists, this will be undefined or null, and the cleanup step should be skipped.
   */
  const oldAvatarUrl = user.avatarUrl;
  if (!oldAvatarUrl) {
    return;
  }
  //TODO Add logic to delete the avatar file from storage if necessary

  await UserModel.findByIdAndUpdate(
    userId,
    { $unset: { avatarUrl: "" } },
    { new: true }
  );
  return;
};

export const getSettings = async (userId: string): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select(
    "emailNotifications privacySettings"
  );
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user as User, "settings");
  return resUser;
};

export const getSecurity = async (userId: string): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select(
    "email phoneNumber passwordHash emailVerified phoneVerified lastPasswordChangeAt twoFactorEnabled oauthProviders"
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(user as User, "security");
  return resUser;
};

export const getSessions = async (
  userId: string,
  sessioId: string
): Promise<
  Array<{
    sessionId: string;
    current: boolean;
    device: string;
    browser: string;
    location: string;
    createdAt: Date;
    lastUsedAt: Date;
    revokedAt?: Date;
  }>
> => {
  const sessions = await SessionModel.find({ userId: userId });

  const resSessions = sessions.map((session) => {
    return {
      sessionId: session.sessionId,
      current: session.sessionId === sessioId,
      device:
        session.device?.vendor +
        " " +
        session.device?.model +
        " " +
        session.device?.type,
      browser: session.browser!.name + " " + session.browser!.version,
      location: session.city + ", " + session.country,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      revokedAt: session.revokedAt,
    };
  });
  return resSessions;
};

export const getBilling = async (userId: string): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select("plan billingInfo");
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(user as User, "billing");
  return resUser;
};

export const updateNotifications = async (
  userId: string,
  notificationPrefs: UpdateNotificationsType
): Promise<Partial<User>> => {
  const update: Record<string, any> = {};

  if (notificationPrefs.emailNotifications !== undefined) {
    update["notificationPrefs.emailOnJobComplete"] =
      notificationPrefs.emailNotifications;
  }

  if (notificationPrefs.pushNotifications !== undefined) {
    update["notificationPrefs.inApp"] = notificationPrefs.pushNotifications;
  }

  if (notificationPrefs.newsletter !== undefined) {
    update["notificationPrefs.marketingEmails"] = notificationPrefs.newsletter;
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(user as User, "settings");
  return resUser;
};

export const updatePrivacySettings = async (
  userId: string,
  privacyPrefs: UpdatePrivacySettingsType
): Promise<Partial<User>> => {
  const update: Record<string, any> = {};
  if (privacyPrefs.profileVisibility !== undefined) {
    update["privacyPrefs.profileVisibility"] = privacyPrefs.profileVisibility;
  }
  if (privacyPrefs.showEmailOnProfile !== undefined) {
    update["privacyPrefs.showEmailOnProfile"] = privacyPrefs.showEmailOnProfile;
  }
  if (privacyPrefs.showLinksOnProfile !== undefined) {
    update["privacyPrefs.showLinksOnProfile"] = privacyPrefs.showLinksOnProfile;
  }
  if (privacyPrefs.allowDiscoverability !== undefined) {
    update["privacyPrefs.allowDiscoverability"] =
      privacyPrefs.allowDiscoverability;
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(user as User, "settings");
  return resUser;
};

export const updatePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await UserModel.findById(userId).select(
    "+passwordHash +changeHistory"
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new UnauthenticatedError("Current password is incorrect");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.lastPasswordChangeAt = new Date();
  user.passwordHash = hashedPassword;
  user.changeHistory.push({
    field: "password",
    by: user._id,
    from: "",
    to: "",
    reason: "User initiated password change",
    at: new Date(),
    via: "user",
  });
  await user.save();
  return;
};

export const updateEmail = async (
  userId: string,
  newEmail: string
): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.email === newEmail) {
    throw new ConflictError("New email is the same as the current email");
  }
  const emailInUse = await UserModel.findOne({ email: newEmail });
  if (emailInUse) {
    throw new ConflictError("Email is already in use");
  }
  const token = generateVerificationToken();
  const code = Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, 6);
  const codeHash = await bcrypt.hash(code, 10);

  const updateEmailUrl = `${
    process.env.APP_URL
  }/verify-email-change?token=${encodeURIComponent(token.raw)}`;

  user.pendingEmailChange = {
    newEmail: newEmail,
    code: codeHash,
    tokenHash: token.hash,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    requestedAt: new Date(),
    requestMethod: "self",
  };
  await user.save();

  console.log("Update Email URL:", updateEmailUrl, "code:", code);
  // send verification code to old email
  sendOldEmailVerificationForEmailUpdate(user, code);
  sendUpdateEmailLink(user, newEmail, updateEmailUrl);
  return;
};

export const deleteSession = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  const session = await SessionModel.findOne({
    userId: userId,
    sessionId: sessionId,
  });

  if (!session) {
    throw new NotFoundError("Session not found");
  }
  if (session.revokedAt) {
    throw new BadRequestError("Session already revoked");
  }

  session.revokedAt = new Date();
  session.valid = false;
  await session.save();
  return;
};

export const deleteAllSessions = async (
  userId: string,
  currentSessionId: string,
  removeCurrent: boolean | undefined
): Promise<void> => {
  const filter: any = { userId: userId };
  if (!removeCurrent) {
    filter.sessionId = { $ne: currentSessionId };
  }
  await SessionModel.updateMany(filter, { revokedAt: new Date(), valid: false })
    .exec()
    .catch((err) => {
      throw new InternalServerError("Could not revoke sessions", err.message);
    });
  return;
};

export const deleteAccount = async (userId: string): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        deletedAt: new Date(),
        accountStatus: "delete",
        $push: {
          changeHistory: {
            $each: [
              {
                field: "accountStatus",
                from: "active",
                to: "delete",
                by: userId,
                reason: "User deleted account",
                at: new Date(),
                via: "user",
              },
            ],
            $slice: -100,
          },
        },
      },
      { session }
    );
    await SessionModel.deleteMany({ userId }, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw new InternalServerError("Could not delete account", String(err));
  } finally {
    session.endSession();
  }
  return;
};

export const reactivateAccount = async (
  userId: string
): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select("+changeHistory +role");
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.accountStatus !== "deactive" && user.accountStatus !== "delete") {
    throw new BadRequestError(
      "Account is not deactivated or deleted other than that cannot be reactivated. Contact support."
    );
  }
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      accountStatus: "active",
      deletedAt: null,
      $push: {
        changeHistory: {
          $each: [
            {
              field: "accountStatus",
              from: user.accountStatus,
              to: "active",
              by: user._id,
              reason: "Account reactivated",
              at: new Date(),
              via: user.role,
            },
          ],
          $slice: -100,
        },
      },
    },
    { new: true }
  );
  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }
  const resUser = returnUserData(updatedUser, "profile");

  return resUser;
};

export const deactivateAccount = async (
  userId: string
): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select("+changeHistory +role");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        accountStatus: "deactive",
        $push: {
          changeHistory: {
            $each: [
              {
                field: "accountStatus",
                from: user.accountStatus,
                to: "deactive",
                by: user._id,
                reason: "Account status updated",
                at: new Date(),
                via: user.role,
              },
            ],
            $slice: -100,
          },
        },
      },
      { new: true, session }
    );
    await SessionModel.deleteMany(
      {
        userId: user._id,
      },
      { session }
    );
    await session.commitTransaction();
    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }
    const resUser = returnUserData(updatedUser, "profile");
    return resUser;
  } catch (err) {
    await session.abortTransaction();
    throw new InternalServerError("Could not update account", String(err));
  } finally {
    session.endSession();
  }
};
