import { Schema, model, Document, Types, HydratedDocument } from "mongoose";
export interface ProjectType extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: "active" | "drafted" | "archived" | "deleted";
  visibility: "public" | "private";
  contextProfileId?: Types.ObjectId;
  activeStoryId?: Types.ObjectId;
  activeStoryGeneratedAt?: Date;
  generationCounts: {
    storiesGenerated: number;
    scenesGenerated: number;
    sceneAssetsGenerated: number;
    audiosGenerated: number;
    videosGenerated: number;
  };
}

const projectSchema = new Schema<ProjectType>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "drafted", "archived", "deleted"],
      default: "active",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    contextProfileId: { type: Schema.Types.ObjectId, ref: "ContextProfile" },
    activeStoryId: { type: Schema.Types.ObjectId, ref: "Story" },
    activeStoryGeneratedAt: { type: Date },
    generationCounts: {
      storiesGenerated: { type: Number, default: 0 },
      scenesGenerated: { type: Number, default: 0 },
      sceneAssetsGenerated: { type: Number, default: 0 },
      audiosGenerated: { type: Number, default: 0 },
      videosGenerated: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export type Project = HydratedDocument<ProjectType>;

export const ProjectModel = model<Project>("Project", projectSchema);
