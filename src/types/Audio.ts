// ── AudioAsset sanitized response ─────────────────────────────────────────────

export interface SanitizedAudioAsset {
  id: string;
  narrationId?: string;
  type: 'narration' | 'background' | 'effect';
  url: string;
  prompt?: string;
  generationSource: 'ai' | 'user';
  status: string;
  voiceId?: string;
  duration?: number;
  version?: number;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
