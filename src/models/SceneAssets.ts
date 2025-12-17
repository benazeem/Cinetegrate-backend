import { Schema, model, Document, Types } from "mongoose";

export interface SceneAsset extends Document {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  type: "image" | "video";
  url: string;
  visibility: "private" | "public";
  prompt?: string;
  generationSource: "ai" | "upload";
  saved: boolean;
  active: boolean;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const sceneAssetSchema = new Schema<SceneAsset>(
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
      index: true,
    },
    type: {
      type: String,
      enum: ["image", "video" ],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "public",
    },
    prompt: {
      type: String,
    },
    generationSource: {
      type: String,
      enum: ["ai", "upload"],
      default: "ai",
    },
    saved: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    width: Number,
    height: Number,
    duration: Number,
  },
  { timestamps: true }
);

export const SceneAssetModel = model<SceneAsset>(
  "SceneAsset",
  sceneAssetSchema
);
