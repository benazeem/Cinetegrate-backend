import { Schema, model, Document, Types } from "mongoose";

interface renderConfig {
  fps?: number;
  resolution?: string; // 1080p, 4k
  bitrate?: number;
  codec?: string; // h264, h265
  quality?: "low" | "medium" | "high";
}

export interface FinalVideo extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  storyId: Types.ObjectId;
  videoUrl: string; // final rendered file
  lastError?: { message: string; code?: number; count?: number };
  backgroundAudioAssetId?: Types.ObjectId;
  narrationAudioAssetId?: Types.ObjectId;
  sceneAssetIds: Types.ObjectId[]; // resolved visuals in order
  duration?: number;
  resolution?: string;
  format?: string;
  status: "rendering" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const finalVideoSchema = new Schema<FinalVideo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    lastError: {
      type: {
        message: String,
        code: Number,
        count: Number,
      },
    },
    backgroundAudioAssetId: {
      type: Schema.Types.ObjectId,
      ref: "AudioAsset",
    },
    narrationAudioAssetId: {
      type: Schema.Types.ObjectId,
      ref: "AudioAsset",
    },
    sceneAssetIds: {
      type: [Schema.Types.ObjectId],
      ref: "SceneAsset",
      required: true,
    },
    duration: Number,
    resolution: String,
    format: String,
    status: {
      type: String,
      enum: ["rendering", "completed", "failed"],
      default: "rendering",
      index: true,
    },
  },
  { timestamps: true }
);

export const FinalVideoModel = model<FinalVideo>(
  "FinalVideo",
  finalVideoSchema
);
