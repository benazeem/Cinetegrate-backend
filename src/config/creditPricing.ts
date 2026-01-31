export type ActionType = 'IMAGE_GEN' | 'AUDIO_GEN' | 'STORY_GEN' | 'VIDEO_GEN';

export const CREDIT_PRICING: Record<ActionType, Record<number, number>> = {
  IMAGE_GEN: {
    1: 2,
    2: 6,
    3: 10,
    4: 15,
  },

  AUDIO_GEN: {
    1: 2,
    2: 5,
    3: 8,
    4: 12,
  },

  STORY_GEN: {
    1: 1,
    2: 3,
    3: 6,
  },

  VIDEO_GEN: {
    1: 10,
    2: 20,
    3: 35,
  },
};
