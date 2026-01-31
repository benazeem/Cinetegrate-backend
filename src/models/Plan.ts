import { Schema, model, InferSchemaType } from 'mongoose';

const planSchema = new Schema(
  {
    key: {
      type: String, // free, pro_basic, pro_standard, premium_standard, premium_best
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    // ===== CREDIT GRANT RULE =====
    creditGrantAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    creditGrantType: {
      type: String,
      enum: ['once', 'monthly'],
      required: true,
    },

    capabilities: {
      story: {
        maxTier: { type: Number, required: true }, // 1–5
        maxDurationSeconds: { type: Number, required: true },
      },

      image: {
        maxTier: { type: Number, required: true }, // 1–4
        cinematicPrompts: { type: Boolean, default: false },
        characterConsistency: { type: Boolean, default: false },
        maxImagesPerStory: { type: Number, required: true },
      },

      audio: {
        maxTier: { type: Number, required: true }, // 1–5
        premiumVoices: { type: Boolean, default: false },
        maxDurationSeconds: { type: Number, required: true },
      },

      video: {
        enabled: { type: Boolean, default: false },
        imageToVideo: { type: Boolean, default: false },
        textToVideo: { type: Boolean, default: false },
        maxSeconds: { type: Number, default: 0 },
        maxResolution: {
          type: Number, // 480, 720, 1080, 1440, 2160
          default: 0,
        },
      },

      editor: {
        previewEnabled: { type: Boolean, default: true },
        exportEnabled: { type: Boolean, default: false },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export type PlanData = InferSchemaType<typeof planSchema>;
export const PlanModel = model<PlanData>('Plan', planSchema);
