import { Schema, model, Document, Types } from 'mongoose';

export interface AudioAsset extends Document {
  userId: Types.ObjectId;
  narrationId?: Types.ObjectId;
  activeNarration: boolean;
  type: 'narration' | 'background' | 'effect';
  url: string;
  prompt?: string;
  generationSource: 'ai' | 'user';
  voiceId?: string;
  duration?: number;
  version?: number;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const audioAssetSchema = new Schema<AudioAsset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    narrationId: {
      type: Schema.Types.ObjectId,
      ref: 'StoryNarration',
    },
    activeNarration: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['narration', 'background', 'effect'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
    },
    generationSource: {
      type: String,
      enum: ['ai', 'user'],
      default: 'ai',
    },
    voiceId: {
      type: String,
    },
    duration: {
      type: Number,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

audioAssetSchema.index(
  { narrationId: 1, activeNarration: 1 },
  { unique: true, partialFilterExpression: { activeNarration: true, deletedAt: { $exists: false } } }
);

audioAssetSchema.index(
  { narrationId: 1, version: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } }
);

export const AudioAssetModel = model<AudioAsset>('AudioAsset', audioAssetSchema);
