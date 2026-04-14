// ── Project status ────────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'active' | 'archive' | 'delete';
export type TransitionableManyProjectStatus = ProjectStatus[];

// ── Sanitized response shapes ─────────────────────────────────────────────────

export interface SanitizedProjectList {
  id: string;
  title: string;
  description?: string;
  visibility: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SanitizedProjectDetail extends SanitizedProjectList {
  defaultContextProfileId?: unknown;
  generationCounts?: unknown;
}
