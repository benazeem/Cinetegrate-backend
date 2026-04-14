import type { SanitizedAudioAsset } from '@app-types/Audio.js';
import type { AudioAsset } from '@models/AudioAsset.js';

export type { SanitizedAudioAsset };

/**
 * Sanitizes an AudioAsset document — never exposes userId or storyId.
 */
export function sanitizeAudioAssetResponse(asset: AudioAsset): SanitizedAudioAsset {
  return {
    id: asset._id.toString(),
    narrationId: asset.narrationId?.toString(),
    type: asset.type,
    url: asset.url,
    prompt: asset.prompt,
    generationSource: asset.generationSource,
    status: asset.status,
    voiceId: asset.voiceId,
    duration: asset.duration,
    version: asset.version,
    isActive: asset.activeNarration ?? false,
    deletedAt: asset.deletedAt?.toISOString(),
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export function sanitizeAudioAssetsResponse(assets: AudioAsset[]): SanitizedAudioAsset[] {
  return assets.map(sanitizeAudioAssetResponse);
}
