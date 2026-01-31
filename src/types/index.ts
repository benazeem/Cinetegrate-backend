export type StoryContent = {
  summary?: string;
  body?: string;
  keywords?: string[];
  tags?: string[];
};

export type Plan = 'free' | 'pro_basic' | 'pro_standard' | 'premium_standard' | 'premium_best';

export type AIMode =
  | 'story'
  | 'scenes'
  | 'narration_text'
  | 'narration_audio'
  | 'image_text'
  | 'image_image'
  | 'video_image'
  | 'video_text';
