import { allFormats, type AssetFormat } from '@constants/sceneAssetConsts.js';
import { Schema, model, Document, Types } from 'mongoose';

export interface SceneAsset extends Document {
  userId: Types.ObjectId;
  sceneId: Types.ObjectId;
  type: 'image' | 'video';
  url: string;
  visibility: 'private' | 'public';
  prompt?: string;
  generationSource: 'ai' | 'user';
  version: number;
  width?: number;
  height?: number;
  format?: AssetFormat;
  duration?: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sceneAssetSchema = new Schema<SceneAsset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sceneId: {
      type: Schema.Types.ObjectId,
      ref: 'Scene',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'public',
    },
    prompt: {
      type: String,
    },
    generationSource: {
      type: String,
      enum: ['ai', 'user'],
      default: 'ai',
    },
    format: {
      type: String,
      enum: allFormats,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    width: Number,
    height: Number,
    duration: Number,

    deletedAt: {
      type: Date,
    },
  },

  { timestamps: true }
);

sceneAssetSchema.index({ userId: 1, createdAt: -1 });

//TTL
sceneAssetSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { deletedAt: { $exists: true } } }
);

export const SceneAssetModel = model<SceneAsset>('SceneAsset', sceneAssetSchema);
