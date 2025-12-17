import { Schema, model, Document, Types } from "mongoose";

export interface StoryHistoryEntry {
  title?: string;
  content?: string;
  audioAssetId?: Types.ObjectId;
  editedAt: Date;
}

export interface Story extends Document {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  title: string;
  content: string;
  lastGeneratedAt?: Date;
  audioAssetId?: Types.ObjectId; // current narration audio
  backgroundAudioAssetId?: Types.ObjectId; // current background audio
  effectAudioAssetsId?: Types.ObjectId[]; // current effect audio
  finalVideoId?: Types.ObjectId; // current Final video output
  status: "active" | "rejected" | "archived";
  selected: boolean;
  generationSource: "ai" | "manual";
  contextProfileId?: Types.ObjectId;
  contextProfileVersion?: number;
  history: StoryHistoryEntry[]; // max 3 (enforced in service)
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<Story>(
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
    title: {
      type: String,
      trim: true,
      maxlength: 200,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    lastGeneratedAt: {
      type: Date,
    },
    audioAssetId: {
      type: Schema.Types.ObjectId,
      ref: "AudioAsset",
    },
    backgroundAudioAssetId: {
      type: Schema.Types.ObjectId,
      ref: "AudioAsset",
    },
    effectAudioAssetsId: [
      {
        type: Schema.Types.ObjectId,
        ref: "AudioAsset",
      },
    ],
    finalVideoId: {
      type: Schema.Types.ObjectId,
      ref: "FinalVideo",
    },
    status: {
      type: String,
      enum: ["active", "rejected", "archived"],
      default: "active",
    },
    selected: {
      type: Boolean,
      default: false,
    },
    generationSource: {
      type: String,
      enum: ["ai", "manual"],
      default: "ai",
    },
    contextProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ContextProfile",
    },
    contextProfileVersion: {
      type: Number,
    },
    history: {
      type: [
        {
          title: { type: String },
          content: { type: String },
          audioAssetId: {
            type: Schema.Types.ObjectId,
            ref: "AudioAsset",
          },
          editedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const StoryModel = model<Story>("Story", storySchema);
