import type { SanitizedScene } from '@app-types/Scene.js';
import type { Scene } from '@models/Scene.js';
import type { SceneAsset } from '@models/SceneAssets.js';

export type { SanitizedScene };

export function sanitizeScenesResponse(scenes: Scene[]): SanitizedScene[] {
  return scenes.map((scene) => {
    const asset = scene.activeAssetId as unknown as SceneAsset | null;

    return {
      id: scene._id.toString(),
      storyId: scene.storyId.toString(),
      order: scene.order,

      title: scene.title,
      description: scene.description,
      imagePrompt: scene.imagePrompt,
      videoPrompt: scene.videoPrompt,

      status: scene.status,
      imageStatus: scene.status, // alias: same as status for backwards compat
      narrativeRole: scene.narrativeRole,
      authorType: scene.authorType,

      duration: scene.duration,

      active: scene.active,
      deletedAt: scene.deletedAt?.toISOString(),

      createdAt: scene.createdAt.toISOString(),
      updatedAt: scene.updatedAt.toISOString(),

      activeAsset: asset
        ? {
            id: asset._id.toString(),
            type: asset.type,
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl,
            duration: asset.duration,
            status: asset.status,
            format: asset.format,
            width: asset.width,
            height: asset.height,
          }
        : null,
    };
  });
}
