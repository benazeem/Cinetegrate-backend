import type { SanitizedContextProfile } from '@app-types/ContextProfile.js';
import type { ContextProfile } from '@models/ContextProfile.js';

export type { SanitizedContextProfile };

/**
 * Sanitizes a ContextProfile document — never exposes userId or projectId.
 */
export function sanitizeContextProfileResponse(context: ContextProfile): SanitizedContextProfile {
  return {
    id: context._id.toString(),
    name: context.name,
    description: context.description,
    scope: context.scope,
    genre: context.genre,
    mood: context.mood,
    style: context.style,
    narrativeScope: context.narrativeScope,
    environment: context.environment,
    worldRules: context.worldRules,
    narrativeConstraints: context.narrativeConstraints,
    characters: context.characters,
    forbiddenElements: context.forbiddenElements,
    isDefaultForProject: context.isDefaultForProject ?? false,
    lastUsedAt: context.lastUsedAt,
    createdAt: context.createdAt,
    updatedAt: context.updatedAt,
  };
}

export function sanitizeContextProfilesResponse(
  contexts: ContextProfile[]
): SanitizedContextProfile[] {
  return contexts.map(sanitizeContextProfileResponse);
}
