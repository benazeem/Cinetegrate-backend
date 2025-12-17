import { Schema, model, Document, Types } from "mongoose";

export interface SceneAssetHistoryEntry {
  assetId: Types.ObjectId;
  replacedAt: Date;
}

export interface SceneEditHistoryEntry {
  title?: string;
  description?: string;
  imagePrompt?: string;
  duration?: number;
  editedAt: Date;
}

export interface Scene extends Document {
  userId: Types.ObjectId;
  storyId: Types.ObjectId;
  order: number;
  title?: string;
  description: string;
  imagePrompt: string;
  lastGeneratedAt?: Date;
  duration?: number;
  generationSource: "ai" | "manual";
  activeAssetId?: Types.ObjectId;
  assetHistory: SceneAssetHistoryEntry[]; // max 3 (enforced in service)
  editHistory: SceneEditHistoryEntry[]; // max 3 (enforced in service)
  contextProfileId?: Types.ObjectId;
  contextProfileVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

const sceneSchema = new Schema<Scene>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },

    order: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
    },

    imagePrompt: {
      type: String,
    },
    lastGeneratedAt: {
      type: Date,
    },
    duration: {
      type: Number,
    },

    generationSource: {
      type: String,
      enum: ["ai", "manual"],
      default: "ai",
    },

    activeAssetId: {
      type: Schema.Types.ObjectId,
      ref: "SceneAsset",
    },

    assetHistory: {
      type: [
        {
          assetId: {
            type: Schema.Types.ObjectId,
            ref: "SceneAsset",
            required: true,
          },
          replacedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    editHistory: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          imagePrompt: { type: String },
          duration: { type: Number },
          editedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    contextProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ContextProfile",
    },

    contextProfileVersion: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const SceneModel = model<Scene>("Scene", sceneSchema);
