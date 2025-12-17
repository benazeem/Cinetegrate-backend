import { Schema, model, Document, Types } from "mongoose";

export interface AudioAsset extends Document {
  userId: Types.ObjectId;
  type: "narration" | "background" | "effect";
  url: string;
  prompt?: string; // for AI-generated audio
  generationSource: "ai" | "upload"; 
  voiceId?: string;
  language?: string;
  accent?: string;
  tone?: string;
  pacing?: string;
  duration?: number; // seconds
  format?: string; // mp3, wav, etc.
  saved: boolean; // saved to library or not
  createdAt: Date;
  updatedAt: Date;
}

const audioAssetSchema = new Schema<AudioAsset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["narration", "background", "effect"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
    },
    generationSource: {
      type: String,
      enum: ["ai", "upload"],
      default: "ai",
    },
    voiceId: {
      type: String,
    },
    language: {
      type: String,
    },
    accent: {
      type: String,
    },
    tone: {
      type: String,
    },
    pacing: {
      type: String,
    },
    duration: {
      type: Number,
    },
    format: {
      type: String,
    },
    saved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const AudioAssetModel = model<AudioAsset>(
  "AudioAsset",
  audioAssetSchema
);
