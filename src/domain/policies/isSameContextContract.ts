import { ContextProfile } from '@models/ContextProfile.js';

export function isSameContextContract(
  projectContext: ContextProfile,
  storyContext: Partial<ContextProfile>
): boolean {
  const normalize = (val: any) => JSON.stringify(val ?? null);

  return (
    projectContext.genre === storyContext.genre &&
    projectContext.mood === storyContext.mood &&
    projectContext.style === storyContext.style &&
    projectContext.narrativeScope === storyContext.narrativeScope &&
    normalize(projectContext.environment) === normalize(storyContext.environment) &&
    normalize(projectContext.narrationProfile) === normalize(storyContext.narrationProfile) &&
    normalize(projectContext.worldRules) === normalize(storyContext.worldRules) &&
    normalize(projectContext.narrativeConstraints) === normalize(storyContext.narrativeConstraints) &&
    normalize(projectContext.characters) === normalize(storyContext.characters) &&
    normalize(projectContext.forbiddenElements) === normalize(storyContext.forbiddenElements)
  );
}
