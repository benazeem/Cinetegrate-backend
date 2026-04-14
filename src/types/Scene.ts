// ── Scene generation modes ────────────────────────────────────────────────────

export type SingleSceneMode = 'generate' | 'variation' | 'regenerate';
export type BatchSceneMode = 'generate' | 'regenerate';

// ── Sanitized response shape ──────────────────────────────────────────────────

export interface SanitizedScene {
  id: string;
  storyId: string;
  order: number;
  title?: string;
  description: string;
  status: 'not-generated' | 'generating' | 'ready' | 'error';
  narrativeRole: 'intro' | 'transition' | 'climax' | 'outro' | 'standard';
  authorType: 'ai' | 'user';
  duration?: number;
  active: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  activeAsset: {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    duration?: number;
    status: 'not-generated' | 'generating' | 'ready' | 'error';
    format: string | undefined;
    width?: number;
    height?: number;
  } | null;
}
