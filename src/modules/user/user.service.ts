import { ACCOUNT_STATUSES, AccountStatus } from "constants/accountStatus.js";
import bcrypt from "bcrypt";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "@middleware/error/index.js";
import { Session, SessionModel } from "@models/Session.js";
import { type User, UserModel } from "@models/User.js";
import { returnUserData } from "@utils/returnUserData.js";
import { UpdateAvatarType } from "@validation/user.schema.js";
import mongoose, { ObjectIdSchemaDefinition } from "mongoose";
import { generateVerificationToken, verifyToken } from "@utils/tokens.js";
import transporter from "config/mail.js";
import { verifyUpdatedEmailTemplate } from "./email/templlate/verifyUpdatedEmail.js";

export const getProfile = async (
  userId: ObjectIdSchemaDefinition
): Promise<User> => {
  const user = await UserModel.findById(userId).select(
    "-passwordHash -emailVerificationToken -resetPasswordToken -createdAt -updatedAt"
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateProfile = async (
  userId: ObjectIdSchemaDefinition,
  updateData: Partial<User>
): Promise<Partial<User>> => {
  const user = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
  });

  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user, "profile");
  return resUser;
};

export const updateAvatar = async (
  userId: ObjectIdSchemaDefinition,
  avatarData: UpdateAvatarType
): Promise<Partial<User>> => {
  // user will send a file not url so treat it here and store it in a location on cloud or locally localstack s3
  const avatarUrl = `/uploads/avatars/${userId.toString()}/${Date.now()}_${avatarData}`;
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { avatarUrl: avatarUrl },
    { new: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user, "profile");
  return resUser;
};

export const deleteAvatar = async (
  userId: ObjectIdSchemaDefinition
): Promise<void> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $unset: { avatarUrl: "" } },
    { new: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return;
};

export const getSettings = async (
  userId: ObjectIdSchemaDefinition
): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select(
    "emailNotifications privacySettings"
  );
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user as User, "settings");
  return resUser;
};

export const getSecurity = async (
  userId: ObjectIdSchemaDefinition
): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select(
    "email phoneNumber passwordHash emailVerified phoneVerified lastPasswordChangeAt twoFactorEnabled oauthProviders"
  );
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user as User, "security");
  return resUser;
};

export const getSessions = async (
  userId: ObjectIdSchemaDefinition,
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
  if (!sessions) {
    throw new InternalServerError("Could not fetch sessions");
  }

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

export const getBilling = async (
  userId: ObjectIdSchemaDefinition
): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId).select("plan billingInfo");
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user as User, "billing");
  return resUser;
};

export const updateNotifications = async (
  userId: ObjectIdSchemaDefinition,
  notificationPrefs: any
): Promise<Partial<User>> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { emailNotifications: notificationPrefs },
    { new: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user as User, "settings");
  return resUser;
};

export const updatePrivacySettings = async (
  userId: ObjectIdSchemaDefinition,
  privacyPrefs: any
): Promise<Partial<User>> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { privacySettings: privacyPrefs },
    { new: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  const resUser = returnUserData(user as User, "settings");
  return resUser;
};

export const updatePassword = async (
  userId: ObjectIdSchemaDefinition,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.lastPasswordChangeAt = new Date();
  user.passwordHash = hashedPassword;
  await user.save();
  return;
};

export const updateEmail = async (
  userId: ObjectIdSchemaDefinition,
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

  const updateEmaillUrl = `${
    process.env.APP_URL
  }/verify-email-change?token=${encodeURIComponent(
    token.raw
  )}&userId=${encodeURIComponent(
    user._id.toString()
  )}&newEmail=${encodeURIComponent(newEmail)}`;

  const { subject, text, html } = verifyUpdatedEmailTemplate(
    user.displayName ?? user.username ?? null,
    updateEmaillUrl
  );

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: newEmail,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new InternalServerError(
      "Failed to send verification email",
      errorMessage
    );
  }
  user.pendingEmailChange = {
    newEmail: newEmail,
    tokenHash: token.hash,
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    requestedAt: new Date(),
    requestMethod: "self",
  };
  await user.save();
  return;
};

export const deleteSession = async (
  userId: ObjectIdSchemaDefinition,
  sessionId: string
): Promise<void> => {
  const session = await SessionModel.findOne({
    userId: userId,
    sessionId: sessionId,
  });

  if (!session) {
    throw new Error("Session not found");
  }
  session.revokedAt = new Date();
  await session.save();
  return;
};

export const deleteAllSessions = async (
  userId: ObjectIdSchemaDefinition,
  currentSessionId: string,
  removeCurrent: boolean | undefined
): Promise<void> => {
  const filter: any = { userId: userId };
  if (!removeCurrent) {
    filter.sessionId = { $ne: currentSessionId };
  }
  await SessionModel.updateMany(filter, { revokedAt: new Date() }).exec();
  return;
};

export const deleteAccount = async (
  userId: ObjectIdSchemaDefinition
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await UserModel.findByIdAndUpdate(
      userId,
      { deletedAt: new Date(), accountStatus: "deleted" },
      { session }
    );
    await SessionModel.deleteMany({ userId }, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
  return;
};

export const updateAccount = async (
  userId: ObjectIdSchemaDefinition,
  updateData: AccountStatus,
  currentSessionId: string
): Promise<Partial<User>> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const latestStatusEvent = await UserModel.aggregate([
    { $match: { _id: userId } },
    { $unwind: "$changeHistory" },
    { $match: { "changeHistory.field": "accountStatus" } },
    { $sort: { "changeHistory.at": -1 } },
    { $limit: 1 },
    { $replaceRoot: { newRoot: "$changeHistory" } },
  ]);
  let updatedUser;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (
      user.role === "user" &&
      updateData !== "disabled" &&
      updateData !== "active"
    ) {
      throw new Error("Only admin can do this operation");
    } else if (
      user.accountStatus === "disabled" &&
      latestStatusEvent[0].via !== "user" &&
      updateData === "active"
    ) {
      throw new Error(
        "Disabled by admin, account can only be activated by admin"
      );
    } else {
      updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { accountStatus: updateData },
        { new: true, session }
      );

      await SessionModel.deleteMany(
        {
          userId: user._id,
          sessionId: { $ne: currentSessionId },
        },
        { session }
      );
    }
    await session.commitTransaction();
    if (!updatedUser) {
      throw new Error("User not found after update");
    }
    const resUser = returnUserData(updatedUser, "profile");
    return resUser;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  }
  finally {
    session.endSession();
  }
};
