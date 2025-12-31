import { ACCOUNT_STATUSES } from "constants/authConsts.js";
import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

const ResetSchema = new Schema(
  {
    tokenHash: { type: String },
    expiresAt: { type: Date },
    requestedAt: { type: Date },
  },
  { _id: false }
);

const UpdateEmailSchema = new Schema(
  {
    newEmail: { type: String, trim: true, lowercase: true },
    tokenHash: { type: String },
    code: { type: String },
    expiresAt: { type: Date },
    requestedAt: { type: Date },
    requestMethod: { type: String }, // "self" | "oauth"
  },
  { _id: false }
);

const changeMetaSchema = new Schema(
  {
    field: {
      type: String,
      required: true,
      enum: ["email", "password", "accountStatus"],
    },

    from: { type: Schema.Types.Mixed, default: null }, // previous value
    to: { type: Schema.Types.Mixed, default: null }, // new value

    by: { type: Schema.Types.ObjectId, ref: "User", required: true },

    reason: { type: String, maxlength: 300, default: null },

    at: { type: Date, default: Date.now },

    via: {
      type: String,
      enum: ["user", "admin", "system"],
      required: true,
    },
  },
  { _id: false }
);

/**
 * Subdocument: OAuth / social providers (Google, GitHub, etc.)
 */
const providerSchema = new Schema(
  {
    provider: {
      type: String,
      required: true, // "google" | "github" | "meta" | ...
      trim: true,
    },
    providerUserId: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // no separate _id needed per provider
);

const privacyPrefsSchema = new Schema(
  {
    profileVisibility: {
      type: String,
      enum: ["private", "public", "unlisted"],
      default: "private",
    },
    showEmailOnProfile: {
      type: Boolean,
      default: false,
    },
    showLinksOnProfile: {
      type: Boolean,
      default: true,
    },
    allowDiscoverability: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

/**
 * Subdocument: notification preferences
 */
const notificationPrefsSchema = new Schema(
  {
    emailOnJobComplete: {
      type: Boolean,
      default: true,
    },
    inApp: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Subdocument: usage / quotas
 */
const usageSchema = new Schema(
  {
    imagesGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    secondsRendered: {
      type: Number,
      default: 0,
      min: 0,
    },
    apiCalls: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastResetAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * MAIN USER SCHEMA
 */
const userSchema = new Schema(
  {
    // Core identity - Basic info
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 80,
      required: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 40,
      index: true,
      sparse: true, // allows null without unique conflict
      unique: true,
      required: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    links: {
      website: String,
      youtube: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      facebook: String,
      github: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    usage: {
      type: usageSchema,
      default: () => ({}),
    },
    // Auth (password-based)
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    lastPasswordChangeAt: {
      type: Date,
      default: Date.now,
    },
    // Tokens (not selected by default)
    passwordReset: {
      type: ResetSchema,
      select: false,
    },
    // OAuth providers (Google, GitHub, Meta, etc.)
    oauthProviders: {
      type: [providerSchema],
      default: [],
    },
    // Security / 2FA
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String }, // "totp" | "sms" | "email"
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false },

    // Contact verification
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerification: {
      type: ResetSchema,
      select: false,
    },
    emailChangeAttempts: {
      type: Number,
      default: 0,
    },
    pendingEmailChange: {
      type: UpdateEmailSchema,
      select: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // Account Status

    accountStatus: { type: String, enum: ACCOUNT_STATUSES, default: "active" },

    // Billing
    billingCustomerId: { type: String },
    billingProvider: { type: String }, // "stripe" | "razorpay" | etc
    subscriptionId: { type: String },
    billingStatus: {
      type: String,
      enum: ["none", "active", "past_due", "canceled", "incomplete"],
      default: "none",
    },
    currentPeriodEnd: { type: Date },
    trialEndsAt: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false }, 
    // Notification settings
    notificationPrefs: {
      type: notificationPrefsSchema,
      default: () => ({
        emailOnJobComplete: true,
        inApp: true,
        marketingEmails: false,
      }),
    }, 
    // Privacy prefs
    privacyPrefs: {
      type: privacyPrefsSchema,
      default: () => ({
        profileVisibility: "private",
        showEmailOnProfile: false,
        showLinksOnProfile: true,
        allowDiscoverability: true,
      }),
    },
    // Legal / Terms
    termsAcceptedAt: { type: Date },
    privacyAcceptedAt: { type: Date },
    marketingConsentAt: { type: Date },
    deletedAt: {
      type: Date,
    },
    changeHistory: {
      type: [changeMetaSchema],
      default: [],
      select: false,
      cap: 100,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index to quickly find by provider (Google, GitHub, etc.)
 */
userSchema.index(
  { "providers.provider": 1, "providers.providerUserId": 1 },
  { sparse: true }
);

export type UserData = InferSchemaType<typeof userSchema>;
export type User = HydratedDocument<UserData>;

export const UserModel = model<UserData>("User", userSchema);
