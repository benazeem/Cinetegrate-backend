import {
  Schema,
  model,
  type InferSchemaType,
  type HydratedDocument,
} from "mongoose";

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

const sessionSchema = new Schema(
  {
    sessionId: String,
    userAgent: String,
    device: {
      model: String,
      vendor: String,
      type: String,
    },
    browser: {
      name: String,
      version: String,
    },
    os: {
      name: String,
      version: String,
    },
    ipInfo: {
      ip: String,
      city: String,
      country: String,
      timezone: String,
      lat: String,
      lng: String,
      isp: String,
    },
    cpu: String,
    engine: String,
    createdAt: Date,
    lastUsedAt: Date,
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
    // Core identity
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 40,
      index: true,
      sparse: true, // allows null without unique conflict
      unique: true,
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
    },

    // Auth (password-based)
    passwordHash: {
      type: String,
      required: true,
    },
    lastPasswordChangeAt: {
      type: Date,
      default: Date.now,
    },
    // OAuth providers (Google, GitHub, Meta, etc.)
    providers: {
      type: [providerSchema],
      default: [],
    },

    // last Login
    sessions: {
      type: [sessionSchema],
      default: [],
    },

    // Contact & recovery
    phoneNumber: {
      type: String,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    passwordReset: {
      // store hashed token + expiry if you implement reset
      tokenHash: { type: String },
      expiresAt: { type: Date },
      requestedAt: { type: Date },
    },

    // Role, Plan, Account Status, Usage
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
    isActive: {
      type: String,
      enum: ["active", "suspended", "banned", "deleted"],
      default: "active",
    },
    usage: {
      type: usageSchema,
      default: () => ({}),
    },

    // Notification settings
    notificationPrefs: {
      type: notificationPrefsSchema,
      default: () => ({}),
    },

    //meta
    timezone: {
      type: String,
      default: "Asia/Kolkata", // or leave undefined
    },
    locale: {
      type: String,
      default: "en-IN",
    },
    deletedAt: {
      type: Date,
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
