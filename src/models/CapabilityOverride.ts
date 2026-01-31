import { Schema, model, InferSchemaType } from 'mongoose';

const capabilityOverrideSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    feature: {
      type: String,
      enum: ['story', 'image', 'audio', 'video'],
      required: true,
      index: true,
    },

    // what is being overridden
    capabilityKey: {
      type: String,
      required: true,
      // examples:
      // "maxTier"
      // "maxResolution"
      // "premiumVoices"
    },

    value: {
      type: Schema.Types.Mixed,
      required: true,
    },

    validFrom: {
      type: Date,
      default: Date.now,
      index: true,
    },

    validTill: {
      type: Date,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ['purchase', 'promo', 'admin'],
      required: true,
    },
  },
  { timestamps: true }
);

capabilityOverrideSchema.index({
  userId: 1,
  feature: 1,
  capabilityKey: 1,
  validTill: 1,
});

export type CapabilityOverrideData = InferSchemaType<typeof capabilityOverrideSchema>;

export const UserCapabilityOverrideModel = model<CapabilityOverrideData>(
  'UserCapabilityOverride',
  capabilityOverrideSchema
);
