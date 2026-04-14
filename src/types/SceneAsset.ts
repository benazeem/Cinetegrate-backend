import type { AssetFormat } from '@constants/sceneAssetConsts.js';

// ── SceneAsset sanitized response ─────────────────────────────────────────────

export interface SanitizedSceneAsset {
  id: string;
  sceneId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  visibility: 'private' | 'public';
  status: 'not-generated' | 'generating' | 'ready' | 'error';
  prompt?: string;
  generationSource: 'ai' | 'user';
  version: number;
  format?: AssetFormat;
  width?: number;
  height?: number;
  duration?: number;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
