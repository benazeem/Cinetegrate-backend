// ── Story sanitized response ──────────────────────────────────────────────────

export interface SanitizedStory {
  id: string;
  projectId?: string;
  contextProfileId?: string | null;
  title: string;
  description?: string;
  platform?: string;
  intent?: string;
  timeLimit?: number;
  status: string;
  content?: {
    body?: string;
    summary?: string;
    keywords?: string[];
    tags?: string[];
    authorType?: 'ai' | 'user';
    contentStatus?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
