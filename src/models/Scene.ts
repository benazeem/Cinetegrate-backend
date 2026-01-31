import { Schema, model, Document, Types } from 'mongoose';

//RULE: deletedAt != null  ⇒ active must be false
export interface Scene extends Document {
  userId: Types.ObjectId;
  storyId: Types.ObjectId;
  order: number;
  title?: string;
  description: string;
  narrativeRole: 'intro' | 'transition' | 'climax' | 'outro' | 'standard';
  authorType: 'ai' | 'user';
  imagePrompt: string;
  videoPrompt: string;
  duration?: number;
  activeAssetId?: Types.ObjectId;
  active: boolean;
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
    narrativeRole: {
      type: String,
      enum: ['intro', 'transition', 'climax', 'outro', 'standard'],
      default: 'standard',
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
    activeAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'SceneAsset',
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: undefined, 
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
