// Barrel export for all response sanitizers

export { sanitizeUserResponse } from './sanitizeUserResponse.js';
export type { UserReturnType } from '@app-types/index.js';

export { sanitizeProjectResponse, sanitizeProjects } from './sanitizeProjectResponse.js';
export type { SanitizedProjectList, SanitizedProjectDetail } from '@app-types/Project.js';

export { sanitizeScenesResponse } from './sanitizeScenesResponse.js';
export type { SanitizedScene } from '@app-types/Scene.js';

export { sanitizeNarrationsResponse } from './sanitizeNarrationResponse.js';

export {
  sanitizeContextProfileResponse,
  sanitizeContextProfilesResponse,
} from './sanitizeContextProfileResponse.js';
export type { SanitizedContextProfile } from '@app-types/ContextProfile.js';

export { sanitizeStoryResponse, sanitizeStoriesResponse } from './sanitizeStoryResponse.js';
export type { SanitizedStory } from '@app-types/Story.js';

export {
  sanitizeAudioAssetResponse,
  sanitizeAudioAssetsResponse,
} from './sanitizeAudioAssetResponse.js';
export type { SanitizedAudioAsset } from '@app-types/Audio.js';

export {
  sanitizeSceneAssetResponse,
  sanitizeSceneAssetsResponse,
} from './sanitizeSceneAssetResponse.js';
export type { SanitizedSceneAsset } from '@app-types/SceneAsset.js';
