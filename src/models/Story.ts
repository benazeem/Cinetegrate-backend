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
  effectAudioAssetIds?: Types.ObjectId[]; // effect audios
  finalVideoId?: Types.ObjectId; // current Final video output
  status: "active" | "rejected" | "archived";
  selected: boolean;
  generationSource: "ai" | "manual";
  contextProfileId?: Types.ObjectId;
  contextProfileVersion?: number;
  editHistory: StoryHistoryEntry[]; // max 3 (enforced in service too)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a Story document in the Cinetegrate system.
 * 
 * A Story is the core narrative unit that drives AI video generation. It encapsulates
 * the creative content along with associated media assets and generation metadata.
 * 
 * @property {ObjectId} userId - Reference to the User who owns this story. Required and indexed for efficient queries.
 * @property {ObjectId} projectId - Optional reference to the parent Project. Allows stories to be organized within projects.
 * @property {string} title - The story title. Max 200 characters, trimmed whitespace.
 * @property {string} content - The main narrative content. This is the primary input for AI video generation.
 * @property {Date} lastGeneratedAt - Timestamp of the most recent video generation from this story.
 * @property {ObjectId} audioAssetId - Reference to the primary AudioAsset (narration/voiceover).
 * @property {ObjectId} backgroundAudioAssetId - Reference to background music AudioAsset.
 * @property {ObjectId[]} effectAudioAssetIds - Array of references to sound effect AudioAssets.
 * @property {ObjectId} finalVideoId - Reference to the generated FinalVideo output.
 * @property {string} status - Story lifecycle state. Values: "active" | "rejected" | "archived". Default: "active".
 * @property {boolean} selected - Flag indicating if story is selected for current workflow. Default: false.
 * @property {string} generationSource - Origin of story content. Values: "ai" | "manual". Default: "ai".
 * @property {ObjectId} contextProfileId - Reference to the ContextProfile used for generation. Enables version tracking and safe regeneration.
 * @property {number} contextProfileVersion - Version number of the ContextProfile at time of generation. Used to detect profile changes and trigger regeneration workflows.
 * @property {StoryHistoryEntry[]} editHistory - Array of up to 3 previous edits, tracking title, content, audio changes, and edit timestamps. Validates maximum 3 entries. Default: [].
 * 
 * @remarks
 * - The contextProfileId and contextProfileVersion pair work together to support safe regeneration scenarios.
 *   When a ContextProfile is updated, stories using older versions can be identified and re-generated with current context.
 * - editHistory provides audit trail and rollback capability while maintaining storage efficiency with a strict 3-entry limit.
 * - Timestamps are automatically managed for createdAt and updatedAt via the schema timestamps option.
 */
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
    effectAudioAssetIds: [
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
    editHistory: {
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
      validate: {
        validator: (v: StoryHistoryEntry[]) => v.length <= 3,
        message: "Story editHistory cannot exceed 3 entries",
      },
    },
  },
  { timestamps: true }
);

export const StoryModel = model<Story>("Story", storySchema);
