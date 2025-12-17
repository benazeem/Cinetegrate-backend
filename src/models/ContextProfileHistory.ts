import { Schema, model, Document, Types } from "mongoose";

interface VideoDefaults {
  fps?: number;
  quality?: string;
}

export interface AudioDefaults {
  voiceId?: string; // provider-specific voice identifier
  gender?: "male" | "female" | "neutral";
  language?: string; // en-US, hi-IN, etc.
  accent?: string; // optional locale/accent
  tone?: "neutral" | "calm" | "dramatic" | "eerie";
  pacing?: "slow" | "medium" | "fast";
  emotionBias?: "flat" | "expressive" | "subtle";
}

export interface ContextProfileHistory extends Document {
  contextProfileId: Types.ObjectId;
  userId: Types.ObjectId; 
  version: number; // version being archived
  snapshot: {
    name: string;
    description?: string;
    genre?: string;
    tone?: string;
    mood?: string;
    style?: string;
    worldRules?: string;
    characters?: {
      name: string;
      description?: string;
    }[];
    narrativeConstraints?: string;
    forbiddenElements?: string[];
    audioDefaults?: AudioDefaults;
    videoConfigDefaults?: VideoDefaults;
  };

  changeReason?: string; // optional user/system note
  changedAt: Date;
}

const contextProfileHistorySchema = new Schema<ContextProfileHistory>(
  {
    contextProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ContextProfile",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    version: {
      type: Number,
      required: true,
    },

    snapshot: {
      name: { type: String, required: true },
      description: { type: String },

      genre: String,
      tone: String,
      mood: String,
      style: String,

      worldRules: String,

      characters: [
        {
          name: { type: String, required: true },
          description: { type: String },
        },
      ],

      narrativeConstraints: String,

      forbiddenElements: {
        type: [String],
        default: [],
      },
      audioDefaults: {
        voiceId: String,
        gender: {
          type: String,
          enum: ["male", "female", "neutral"],
        },
        language: String,
        accent: String,
        tone: {
          type: String,
          enum: ["neutral", "calm", "dramatic", "eerie"],
        },
        pacing: {
          type: String,
          enum: ["slow", "medium", "fast"],
        },
        emotionBias: {
          type: String,
          enum: ["flat", "expressive", "subtle"],
        },
      },

      videoConfigDefaults: {
        fps: Number,
        quality: String,
      },
    },

    changeReason: {
      type: String,
      maxlength: 1000,
    },

    changedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

export const ContextProfileHistoryModel = model<ContextProfileHistory>(
  "ContextProfileHistory",
  contextProfileHistorySchema
);
