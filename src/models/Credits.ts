import { Schema, model, InferSchemaType } from 'mongoose';

const creditsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    planKey: {
      type: String,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ['free_plan', 'monthly_plan', 'one_month_plan', 'admin', 'promo'],
      required: true,
      index: true,
    },
    creditType: {
      type: String,
      enum: ['ai', 'render'],
      required: true,
      index: true,
    },

    creditsGranted: {
      type: Number,
      required: true,
      min: 0,
    },

    creditsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    validTill: {
      type: Date,
      index: true,
    },

    isExpired: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

creditsSchema.index(
  { userId: 1, source: 1 },
  {
    unique: true,
    partialFilterExpression: { source: 'free_plan' },
  }
);

creditsSchema.index({
  userId: 1,
  isExpired: 1,
  validTill: 1,
  createdAt: 1,
});

export type CreditsData = InferSchemaType<typeof creditsSchema>;
export const CreditsModel = model<CreditsData>('UserCredits', creditsSchema);
