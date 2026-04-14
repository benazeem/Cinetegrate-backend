// ── Shared application types ──────────────────────────────────────────────────
// Central barrel — import app types from here or from their specific file.

export type { SignOutput, RefreshTokenOutput } from './Auth.js';

export type {
  ProjectStatus,
  TransitionableManyProjectStatus,
  SanitizedProjectList,
  SanitizedProjectDetail,
} from './Project.js';

export type { SanitizedStory } from './Story.js';

export type { SingleSceneMode, BatchSceneMode, SanitizedScene } from './Scene.js';

export type { SanitizedSceneAsset } from './SceneAsset.js';

export type { SanitizedAudioAsset } from './Audio.js';

export type { SanitizedContextProfile } from './ContextProfile.js';

export type { ErrorCode } from './Error.js';

export type StoryContent = {
  summary?: string;
  body?: string;
  keywords?: string[];
  tags?: string[];
};

export type AIMode =
  | 'story'
  | 'scenes'
  | 'narration_text'
  | 'narration_audio'
  | 'image_text'
  | 'image_image'
  | 'video_image'
  | 'video_text';

export type Plan = 'free' | 'pro_basic' | 'pro_standard' | 'premium_standard' | 'premium_best';

export type UserReturnType = 'profile' | 'settings' | 'security' | 'billing' | 'account';
