import { Schema, model, Document, Types, HydratedDocument } from "mongoose";
export interface ProjectType extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  status: "active" | "draft" | "archive" | "delete";
  visibility: "public" | "private";  
  defaultContextProfileId: Types.ObjectId;
  generationCounts: {
    storiesGenerated: number;
    scenesGenerated: number;
    sceneAssetsGenerated: number;
    audiosGenerated: number;
    videosGenerated: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectType>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "archive", "delete"],
      default: "active",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    }, 
    defaultContextProfileId: { type: Schema.Types.ObjectId, ref: "ContextProfile", required: true }, 
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

projectSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type Project = HydratedDocument<ProjectType>;

export const ProjectModel = model<Project>("Project", projectSchema);
