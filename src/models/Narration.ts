import { Schema, model, Document, Types, HydratedDocument } from 'mongoose';

export interface NarrationSegment {
  character: string;
  startTime: number;
  endTime: number;
  duration: number;
  targetWordCount: number;
  minWords: number;
  maxWords: number;
  narration: string;
}

export interface StoryNarration extends Document {
  userId: Types.ObjectId;
  storyId: Types.ObjectId;
  sceneOrder: Types.ObjectId[];
  sceneOrderHash: string;
  activeAudioAssetId?: Types.ObjectId;
  totalDuration: number;
  narrationSegments: NarrationSegment[];
  version: number;
  active: boolean;
  deletedAt?: Date;
  source: 'ai' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const narrationSegmentSchema = new Schema<NarrationSegment>(
  {
    startTime: {
      type: Number,
      required: true,
      min: 0,
    },

    endTime: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      type: Number,
      required: true,
      min: 0,
    },

    targetWordCount: {
      type: Number,
      required: true,
      min: 0,
    },

    minWords: {
      type: Number,
      required: true,
      min: 0,
    },

    maxWords: {
      type: Number,
      required: true,
      min: 0,
    },

    narration: {
      type: String,
      required: true,
      trim: true,
    },
    character: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const storyNarrationSchema = new Schema<StoryNarration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    storyId: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    sceneOrder: {
      type: [Schema.Types.ObjectId],
      ref: 'Scene',
      required: true,
    },
    sceneOrderHash: {
      type: String,
      required: true,
      index: true,
    },
    activeAudioAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'AudioAsset',
    },
    totalDuration: {
      type: Number,
      required: true,
      min: 1,
    },

    narrationSegments: {
      type: [narrationSegmentSchema],
      required: true,
    },

    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    source: {
      type: String,
      enum: ['ai', 'user'],
      required: true,
      default: 'ai',
    },
  },
  { timestamps: true }
);

storyNarrationSchema.index({ sceneOrder: 1, version: -1 }, { unique: true });
storyNarrationSchema.index(
  { sceneOrder: 1, active: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

// TTL index to auto-delete soft-deleted narrations after 30 days
storyNarrationSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { deletedAt: { $exists: true } } }
);

export const StoryNarrationModel = model<StoryNarration>('StoryNarration', storyNarrationSchema);
export type StoryNarrationType = HydratedDocument<StoryNarration>;
