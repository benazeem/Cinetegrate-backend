import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";

const sessionSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  userAgent: String,

  device: {
    model: { type: String },
    vendor: { type: String },
    type: { type: String },
  },

  browser: {
    name: { type: String },
    version: { type: String },
  },

  os: {
    name: { type: String },
    version: { type: String },
  },

  ip: { type: String },
  city: { type: String },
  country: { type: String },
  timezone: { type: String },
  lat: { type: String },
  lng: { type: String },
  isp: { type: String },
  cpu: { type: String },
  engine: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
});

//TTL index: automatically remove sessions not used for 30 days
sessionSchema.index(
  { lastUsedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);
sessionSchema.index(
  { revokedAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { revokedAt: { $exists: true } },
  }
);

// Compound index: efficient listing of sessions newest-first
sessionSchema.index({ userId: 1, lastUsedAt: -1 });

export type SessionData = InferSchemaType<typeof sessionSchema>;
export type Session = HydratedDocument<SessionData>;

export const SessionModel = model<SessionData>("Session", sessionSchema);
