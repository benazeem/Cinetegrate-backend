import { Schema, model, Document, Types } from "mongoose";

interface videoDefaults {
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

export interface ContextProfile extends Document {
  userId: Types.ObjectId; 
  name: string; // e.g. "Dark Horror Universe"
  description?: string; // human-readable intent
  genre?: string; // horror, sci-fi, drama
  tone?: string; // dark, light, serious
  mood?: string; // eerie, hopeful, tense
  style?: string; // cinematic, poetic, minimal
  worldRules?: string; // invariants of the universe
  characters?: {
    name: string;
    description?: string;
  }[];

  narrativeConstraints?: string; // POV, tense, length rules
  forbiddenElements?: string[]; // things AI must avoid
  audioDefaults?: AudioDefaults;
  videoConfigDefaults?: videoDefaults;

  active: boolean; // active for project usage
  version: number; // increments on edit

  createdAt: Date;
  updatedAt: Date;
}

const contextProfileSchema = new Schema<ContextProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    genre: String,
    tone: String,
    mood: String,
    style: String,

    worldRules: {
      type: String,
      maxlength: 5000,
    },

    characters: [
      {
        name: { type: String, required: true },
        description: { type: String },
      },
    ],

    narrativeConstraints: {
      type: String,
      maxlength: 3000,
    },

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

    active: {
      type: Boolean,
      default: true,
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const ContextProfileModel = model<ContextProfile>(
  "ContextProfile",
  contextProfileSchema
);
