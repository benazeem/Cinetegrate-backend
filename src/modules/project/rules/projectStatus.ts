export { type ProjectStatus, type TransitionableManyProjectStatus } from '@app-types/Project.js';
import type { ProjectStatus } from '@app-types/Project.js';

export const ACTIVE_STATUSES: ['active', 'draft'] = ['active', 'draft'];
export const NON_DELETED_STATUSES: ['active', 'draft', 'archive'] = ['active', 'draft', 'archive'];

export function canTransition(from: ProjectStatus, to: ProjectStatus) {
  const allowed: Record<ProjectStatus, ProjectStatus[]> = {
    draft: ['active', 'delete'],
    active: ['archive', 'delete'],
    archive: ['active', 'delete'],
    delete: ['active'],
  };
  return allowed[from]?.includes(to);
}

// When Deleting or Archiving a project, set visibility to private
// Additional status rules can be added here as needed
