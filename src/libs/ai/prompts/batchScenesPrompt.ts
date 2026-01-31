import { ContextProfile } from '@models/ContextProfile.js';
import { GLOBAL_SAFETY_RULES } from '../constants/globalSafetyRules.js';
import { buildContextSection } from './utils/buildContextSection.js';
import { Platform, StoryIntent } from '@constants/storyConsts.js';
import {
  MULTI_SCENE_GENERATION_PROMPT,
  MULTI_SCENE_REGENERATION_PROMPT,
  MULTI_SCENE_STRUCTURE_FORMAT,
} from '../constants/scenesPromptConts.js';
import { StoryContent } from 'types/index.js';

export type BatchSceneMode = 'generate' | 'regenerate';

type BuildBatchScenePromptInput = {
  mode: BatchSceneMode;
  storyTitle: string;
  storyContent: StoryContent;
  totalScenes: number;
  storyTimeLimit?: number;
  intent: StoryIntent;
  platform: Platform;
  contextProfile?: ContextProfile | null;
  extraPrompt?: string;
};

export function batchScenesPrompt(input: BuildBatchScenePromptInput): string {
  const {
    mode,
    storyTitle,
    storyContent,
    totalScenes,
    storyTimeLimit,
    intent,
    platform,
    contextProfile,
    extraPrompt,
  } = input;

  if (!totalScenes || totalScenes <= 0) {
    throw new Error('totalScenes must be a positive integer for batch generation');
  }

  const sections: string[] = [];

  // ROLE
  sections.push(
    `
You are a professional cinematic storyteller.
You write structured, coherent, visually rich scenes.
Follow all constraints exactly.
Do not explain your reasoning.
`.trim()
  );

  // MODE FRAMING
  sections.push(
    mode === 'generate' ? MULTI_SCENE_GENERATION_PROMPT.trim() : MULTI_SCENE_REGENERATION_PROMPT.trim()
  );

  // STORY CONTEXT
  sections.push(
    `
STORY CONTEXT
Title: "${storyTitle}"
Summary: "${storyContent.summary}"
Platform: ${platform}
Intent: ${intent}
`.trim()
  );

  // STYLE CONTEXT (optional but useful)
  if (storyContent.keywords?.length || storyContent.tags?.length) {
    sections.push(
      `
STYLE HINTS
Keywords: ${storyContent.keywords?.join(', ') || 'N/A'}
Tags: ${storyContent.tags?.join(', ') || 'N/A'}
`.trim()
    );
  }

  // FULL STORY BODY — only for continuity
  if (storyContent.body) {
    sections.push(
      `
FULL STORY REFERENCE (FOR CONTINUITY ONLY)

${storyContent.body}

Rules:
- This is reference material only
- Do NOT rewrite it
- Do NOT summarize it
- Do NOT restate it
- Use it only to preserve continuity and logic
`.trim()
    );
  }

  // SCENE COUNT CONSTRAINT
  sections.push(
    `
SCENE COUNT CONSTRAINT

You must output EXACTLY ${totalScenes} scenes.
Do NOT add scenes.
Do NOT remove scenes.
Do NOT merge scenes.
Do NOT skip scenes.
`.trim()
  );

  // TIME BUDGET
  if (storyTimeLimit) {
    const perSceneTimeLimit = Math.floor(storyTimeLimit / totalScenes);
    sections.push(
      `
TIME BUDGET

Total story duration: ${storyTimeLimit} seconds
Target per scene: ~${perSceneTimeLimit} seconds

Rules:
- Minor variation is allowed
- Do NOT significantly overshoot or undershoot
`.trim()
    );
  }

  // CONTEXT PROFILE
  if (contextProfile) {
    const contextSection = buildContextSection(contextProfile);
    if (contextSection) sections.push(contextSection);
  }

  // EXTRA PROMPT (mainly for regeneration tuning)
  if (extraPrompt) {
    sections.push(
      `
ADDITIONAL CREATIVE DIRECTION
${extraPrompt}
`.trim()
    );
  }

  // SAFETY
  sections.push(GLOBAL_SAFETY_RULES.trim());

  // OUTPUT FORMAT
  sections.push(MULTI_SCENE_STRUCTURE_FORMAT.trim());

  return sections.join('\n\n');
}
