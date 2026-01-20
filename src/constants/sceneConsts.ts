// Scene validation constants
export const MAX_SCENE_TITLE_LENGTH = 200;
export const MAX_SCENE_DESCRIPTION_LENGTH = 2000;
export const MAX_SCENE_PROMPT_LENGTH = 1000;
export const MIN_SCENE_DURATION = 1;
export const MAX_SCENE_DURATION = 60; // seconds
export const MAX_SCENES_PER_STORY = 100;
export const MAX_EXTRA_PROMPT_LENGTH = 500;

// Ordering constants
export const SCENE_ORDER_GAP = 1000;

// Author types
export const sceneAuthorType = ['ai', 'user'] as const;
export type SceneAuthorType = (typeof sceneAuthorType)[number];
