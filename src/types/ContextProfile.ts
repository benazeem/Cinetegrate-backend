// ── ContextProfile sanitized response ─────────────────────────────────────────

export interface SanitizedContextProfile {
  id: string;
  name: string;
  description?: string;
  scope: string;
  genre: string;
  mood: string;
  style: string;
  narrativeScope?: string;
  environment: unknown;
  worldRules?: string;
  narrativeConstraints?: string;
  characters?: unknown[];
  forbiddenElements?: unknown[];
  isDefaultForProject: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
