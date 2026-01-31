import { Schema, model, Document, Types } from 'mongoose';

// export interface SceneAssetHistoryEntry {
//   assetId: Types.ObjectId;
//   replacedAt: Date;
// }

// export interface SceneEditHistoryEntry {
//   title?: string;
//   description?: string;
//   imagePrompt?: string;
//   duration?: number;
//   editedAt: Date;
// }

// Put all history tracking in SceneRevision model later

export interface Scene extends Document {
  userId: Types.ObjectId;
  storyId: Types.ObjectId;
  order: number;
  title?: string;
  description: string;
  authorType: 'ai' | 'user';
  imagePrompt: string;
  videoPrompt: string;
  duration?: number;
  activeAssetId?: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sceneSchema = new Schema<Scene>(
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
    authorType: {
      type: String,
      enum: ['ai', 'user'],
      default: 'ai',
    },
    imagePrompt: {
      type: String,
      required: true,
    },
    videoPrompt: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    deletedAt: {
      type: Date,
      default: undefined,
      index: true,
    },
  },
  { timestamps: true }
);

sceneSchema.index(
  { storyId: 1, order: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: { $exists: false } },
  }
);

export const SceneModel = model<Scene>('Scene', sceneSchema);
