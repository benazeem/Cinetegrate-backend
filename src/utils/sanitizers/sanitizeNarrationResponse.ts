import { StoryNarration } from '@models/Narration.js';
import { AudioAsset } from '@models/AudioAsset.js';

export function sanitizeNarrationsResponse(narrations: StoryNarration[]) {
  return narrations.map((narration) => {
    const audio = narration.activeAudioAssetId as unknown as AudioAsset | null;

    return {
      id: narration._id.toString(),
      storyId: narration.storyId.toString(),

      sceneOrder: narration.sceneOrder.map((id) => id.toString()),
      sceneOrderHash: narration.sceneOrderHash,

      totalDuration: narration.totalDuration,

      narrationSegments: narration.narrationSegments.map((seg) => ({
        startTime: seg.startTime,
        endTime: seg.endTime,
        duration: seg.duration,
        targetWordCount: seg.targetWordCount,
        minWords: seg.minWords,
        maxWords: seg.maxWords,
        narration: seg.narration,
        character: seg.character,
      })),

      version: narration.version,
      active: narration.active,

      status: narration.status,
      source: narration.source,

      createdAt: narration.createdAt.toISOString(),
      updatedAt: narration.updatedAt.toISOString(),

      activeAudioAsset: audio
        ? {
            id: audio._id.toString(),
            url: audio.url,
            status: audio.status,
            duration: audio.duration,
            voiceId: audio.voiceId,
            type: audio.type,
          }
        : null,
    };
  });
}
