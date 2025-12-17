import { Schema, model, Document, Types } from "mongoose";

interface RenderConfig {
  fps?: number;
  resolution?: "480p" | "720p" | "1080p" | "1440p";
  bitrate?: number;
  codec?: string; // h264, h265 ;
}

export interface FinalVideo extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  storyId: Types.ObjectId;
  videoUrl?: string; // final rendered file
  lastError?: { message: string; code?: number; count?: number };
  backgroundAudioAssetId?: Types.ObjectId;
  narrationAudioAssetId?: Types.ObjectId;
  sceneAssetIds: Types.ObjectId[]; // resolved visuals in order
  duration?: number;
  renderConfig?: RenderConfig;
  status: "rendering" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a FinalVideo document in the Cinetegrate system.
 *
 * A FinalVideo is the rendered output of the AI video generation process. It contains
 * the final video file, associated audio assets, scene compositions, and rendering configuration.
 *
 * @property {ObjectId} userId - Reference to the User who owns this video. Required and indexed for efficient queries.
 * @property {ObjectId} projectId - Reference to the parent Project. Required and indexed for efficient queries.
 * @property {ObjectId} storyId - Reference to the source Story. Required and indexed for efficient queries.
 * @property {string} videoUrl - URL to the final rendered video file.
 * @property {Object} lastError - Error information from failed rendering attempts. Contains message, code, and count of consecutive failures.
 * @property {string} lastError.message - Error message describing the failure.
 * @property {number} lastError.code - Error code for programmatic handling.
 * @property {number} lastError.count - Count of consecutive failures.
 * @property {ObjectId} backgroundAudioAssetId - Reference to the background music AudioAsset.
 * @property {ObjectId} narrationAudioAssetId - Reference to the narration/voiceover AudioAsset.
 * @property {ObjectId[]} sceneAssetIds - Ordered array of SceneAsset references representing visual compositions. Required.
 * @property {number} duration - Total duration of the final video in seconds.
 * @property {Object} renderConfig - Configuration parameters for video rendering.
 * @property {number} renderConfig.fps - Frames per second for output video.
 * @property {string} renderConfig.resolution - Output resolution. Values: "480p" | "720p" | "1080p" | "1440p".
 * @property {number} renderConfig.bitrate - Bitrate in kbps for encoding.
 * @property {string} renderConfig.codec - Video codec used. Values: "h264" | "h265".
 * @property {string} status - Rendering lifecycle state. Values: "rendering" | "completed" | "failed". Default: "rendering". Indexed for efficient status queries.
 * @property {Date} createdAt - Timestamp of document creation. Automatically managed.
 * @property {Date} updatedAt - Timestamp of last document update. Automatically managed.
 *
 * @remarks
 * - The sceneAssetIds array maintains scene order critical to final video composition.
 * - lastError tracking enables robust retry logic and failure diagnostics.
 * - renderConfig provides comprehensive control over output quality and format.
 */

const finalVideoSchema = new Schema<FinalVideo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    videoUrl: {
      type: String,
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
      type: [{ type: Schema.Types.ObjectId, ref: "SceneAsset" }],
      required: true,
    },
    duration: Number,
    renderConfig: {
      fps: Number,
      resolution: {
        type: String,
        enum: ["480p", "720p", "1080p", "1440p"],
      },
      bitrate: Number,
      codec: String,
    },
    status: {
      type: String,
      enum: ["rendering", "completed", "failed"],
      default: "rendering",
      index: true,
    },
  },
  { timestamps: true }
);

finalVideoSchema.index({ userId: 1, status: 1 });

export const FinalVideoModel = model<FinalVideo>(
  "FinalVideo",
  finalVideoSchema
);
