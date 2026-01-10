 import { Schema, model, Document, Types } from "mongoose";
 import { type StoryIntent, type Platform, platform, storyIntent } from "@constants/storyConsts.js";

// export interface StoryHistoryEntry {
//   title?: string;
//   description?: string;
//   content?: string; 
//   timeLimit?: number;
//   editedAt: Date;
// }

//TODO: Put all history tracking in StoryRevision model later
 

export interface Story extends Document {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  title: string;
  description: string;
  content: {
    summary: string;
    body: string;
    keywords?: string[];
    tags?: string[];
  };
  authorType: "ai" | "user"; 
  status: "active" | "delete" | "archive" | "draft"; 
  timeLimit?: number;
  contextProfileId?: Types.ObjectId;  
  intent: StoryIntent;
  platform: Platform;
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
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      required: true,
    },
    content: {
      body: {
        type: String,
        default: "",
      },
      summary: {
        type: String,
        default: "",
      },
      keywords: {
        type: [String],
        default: [],
      },
      tags: {
        type: [String],
        default: [],
      },
    },
    authorType: {
      type: String,
      enum: ["ai", "user"],
      default: "ai",
    },
    status: {
      type: String,
      enum: ["active", "archive", "delete", "draft"],
      default: "active",
    }, 
    timeLimit: {
      type: Number,
    },
    contextProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ContextProfile",
    },  
    intent: {
      type: String,
      enum: [
         ...storyIntent
      ],
      required: true,
      default: "short-form",
    },
    platform: {
      type: String,
      enum: [...platform],
      required: true,
      default: "youtube",
    },
  },
  { timestamps: true }
);

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ userId: 1, projectId: 1, createdAt: -1 });  

export const StoryModel = model<Story>("Story", storySchema);