import type { SanitizedSceneAsset } from '@app-types/SceneAsset.js';
import type { SceneAsset } from '@models/SceneAssets.js';

export type { SanitizedSceneAsset };

/**
 * Sanitizes a SceneAsset document — never exposes userId.
 */
export function sanitizeSceneAssetResponse(asset: SceneAsset): SanitizedSceneAsset {
  return {
    id: asset._id.toString(),
    sceneId: asset.sceneId.toString(),
    type: asset.type,
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl,
    visibility: asset.visibility,
    status: asset.status,
    prompt: asset.prompt,
    generationSource: asset.generationSource,
    version: asset.version,
    format: asset.format,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    deletedAt: asset.deletedAt?.toISOString(),
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export function sanitizeSceneAssetsResponse(assets: SceneAsset[]): SanitizedSceneAsset[] {
  return assets.map(sanitizeSceneAssetResponse);
}
