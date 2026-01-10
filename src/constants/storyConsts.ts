const platform = [
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
  "twitter",
  "snapchat",
  "pinterest",
  "vimeo",
  "reddit",
  "whatsapp",
  "telegram",
] as const;
const storyIntent = [
  "short-form",
  "long-form",
  "ad",
  "story",
  "documentary",
  "vlog",
  "tutorial",
  "explainer",
  "presentation",
  "pitch",
  "education",
  "news",
  "entertainment",
  "comedy",
  "trailer",
  "teaser",
  "product-demo",
  "walkthrough"
] as const;

// Seconds
export const minTimeLimit = 10;
export const maxTimeLimit = 120;

export type StoryIntent = typeof storyIntent[number];
export type Platform = typeof platform[number];
export { platform, storyIntent };