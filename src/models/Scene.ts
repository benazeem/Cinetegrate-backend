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
  assetHistory: SceneAssetHistoryEntry[]; // max 3 (enforced in service too)
  editHistory: SceneEditHistoryEntry[]; // max 3 (enforced in service too)
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
    },

    order: {
      type: Number,
      required: true,
      min: 0,
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
      required: true,
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
      validate: {
        validator: (v: SceneAssetHistoryEntry[]) => v.length <= 3,
        message: "Scene assetHistory cannot exceed 3 entries",
      },
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
      validate: {
        validator: (v: SceneEditHistoryEntry[]) => v.length <= 3,
        message: "Scene editHistory cannot exceed 3 entries",
      },
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

sceneSchema.index({ storyId: 1, order: 1 }, { unique: true });

export const SceneModel = model<Scene>("Scene", sceneSchema);
