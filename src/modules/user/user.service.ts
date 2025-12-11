import bcrypt from "bcrypt";
import { InternalServerError } from "@middleware/error/index.js";
import { Session, SessionModel } from "@models/Session.js";
import { type User, UserModel } from "@models/User.js";
import { returnUserData } from "@utils/returnUserData.js";
import { UpdateAvatarType } from "@validation/user.schema.js";
import { ObjectIdSchemaDefinition } from "mongoose";

export const getProfile = async (
  userId: ObjectIdSchemaDefinition
): Promise<User> => {
  console.log("Fetching profile for userId:", userId);
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
  // now here user will send a email to new email and that email will have to verify itself by clicking a link
  // or can send mail to new and old email both for verification before changing the email in db
  // better is if email is verified don't verify old email just send a notification to old email
  // if email is not verified then ask user to verify old email before changing to new email
};

export const verifyEmail = async (
  userId: ObjectIdSchemaDefinition,
  method: string
): Promise<void> => {
  if (method === "sendVerificationLink") {
    // send verification link to user's email
  } else if (method === "verifyWithCode") {
    // verify the code sent to user's email
  }
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
  removeCurrent: boolean
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
  await UserModel.findByIdAndUpdate(
    userId,
    { deletedAt: new Date(), accountStatus: "deleted" },
    { new: true }
  );
  await SessionModel.deleteMany({ userId: userId });
  return;
};

export const updateAccount = async (
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
