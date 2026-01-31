import { ContextProfile } from '@models/ContextProfile.js';
import { GLOBAL_SAFETY_RULES } from '../constants/globalSafetyRules.js';
import { buildContextSection } from './utils/buildContextSection.js';
import { Platform, StoryIntent } from '@constants/storyConsts.js';
import {
  SINGLE_SCENE_GENERATION_PROMPT,
  SCENE_VARIATION_PROMPT,
  SCENE_REGENERATION_PROMPT,
  SCENE_STRUCTURE_FORMAT,
} from '../constants/scenesPromptConts.js';
import { BadRequestError } from '@middleware/error/index.js';
import { StoryContent } from 'types/index.js';

export type SingleSceneMode = 'generate' | 'variation' | 'regenerate';

type BuildSingleScenePromptInput = {
  mode: SingleSceneMode;

  storyTitle: string;
  storyContent: StoryContent;

  sceneIndex: number;
  totalScenes?: number;

  intent: StoryIntent;
  platform: Platform;

  previousScenesSummary?: string; // ALL previous scenes (arc)
  nextScenesSummary?: string; // ALL next scenes (soft)

  baseScene?: string; // required for variation & regenerate

  timeLimit?: number;
  contextProfile?: ContextProfile | null;

  sceneTitle?: string;
  sceneDescription?: string;

  extraPrompt?: string;
};

export function singleScenePrompt(input: BuildSingleScenePromptInput): string {
  const {
    mode,
    storyTitle,
    storyContent,
    sceneIndex,
    totalScenes,
    intent,
    platform,
    previousScenesSummary,
    nextScenesSummary,
    baseScene,
    timeLimit,
    contextProfile,
    sceneTitle,
    sceneDescription,
    extraPrompt,
  } = input;

  if (mode !== 'generate' && !baseScene) {
    throw new BadRequestError(`${mode} mode requires baseScene`);
  }

  if (mode === 'variation' && (!previousScenesSummary || !nextScenesSummary)) {
    throw new BadRequestError('variation mode requires previousScenesSummary and nextScenesSummary');
  }

  const sections: string[] = [];

  // ROLE
  sections.push(
    `
You are a professional cinematic storyteller.
Write concise, visually rich, emotionally grounded scenes.
Follow all constraints exactly.
Do not explain your reasoning.
`.trim()
  );

  // MODE FRAMING
  if (mode === 'generate') {
    sections.push(SINGLE_SCENE_GENERATION_PROMPT.trim());
  }

  if (mode === 'variation') {
    sections.push(SCENE_VARIATION_PROMPT.trim());
    sections.push(
      `
Additional Variation Rules:
- You may change environment, weather, lighting, time of day
- You may change mood, tone, tension, emotional color
- You may change visual framing and atmosphere
- You may NOT change what happens
- You may NOT add or remove events
- You may NOT change outcomes
- You may NOT alter character intent or decisions
`.trim()
    );
  }

  if (mode === 'regenerate') {
    sections.push(SCENE_REGENERATION_PROMPT.trim());
  }

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

  if (storyContent.keywords?.length || storyContent.tags?.length) {
    sections.push(
      `
STYLE HINTS
Keywords: ${storyContent.keywords?.join(', ') || 'N/A'}
Tags: ${storyContent.tags?.join(', ') || 'N/A'}
`.trim()
    );
  }

  // POSITION
  sections.push(
    `
SCENE POSITION
This is scene ${sceneIndex}${totalScenes ? ` of ${totalScenes}` : ''}.
`.trim()
  );

  if (sceneTitle) {
    sections.push(`SCENE TITLE\n"${sceneTitle}"`.trim());
  }

  if (sceneDescription) {
    sections.push(`SCENE DESCRIPTION\n"${sceneDescription}"`.trim());
  }

  // GENERATE MODE = ARC AWARE
  if (mode === 'generate') {
    if (previousScenesSummary) {
      sections.push(
        `
STORY SO FAR (HARD CONTINUITY CONSTRAINT)
${previousScenesSummary}

Rules:
- Do not repeat
- Do not contradict
- Build on these events
`.trim()
      );
    }

    if (nextScenesSummary) {
      sections.push(
        `
UPCOMING STORY DIRECTION (SOFT CONSTRAINT)
${nextScenesSummary}

Rules:
- You may foreshadow
- Do not jump ahead
- Do not contradict
`.trim()
      );
    }
  }

  // VARIATION MODE = SAME SCENE, DIFFERENT FEEL
  if (mode === 'variation') {
    sections.push(
      `
BASE SCENE (DO NOT CHANGE EVENTS)
${baseScene}

Rules:
- Same actions
- Same outcome
- Same facts
- Only change environment, mood, atmosphere, tone, cinematic framing
`.trim()
    );

    sections.push(
      `
FUTURE CONTEXT (DO NOT BREAK)
${nextScenesSummary}
`.trim()
    );
  }

  // REGENERATE MODE = FULL REWRITE, SAME PURPOSE
  if (mode === 'regenerate') {
    sections.push(
      `
BASE SCENE (TO BE COMPLETELY REWRITTEN)
${baseScene}

Rules:
- You may rewrite structure, pacing, and presentation
- You may reframe how events are shown
- You may improve clarity and drama
- You must preserve story logic
- You must preserve timeline consistency
- You must preserve character intent
- Do NOT introduce new plot events unless specified
`.trim()
    );
  }

  if (timeLimit) {
    sections.push(
      `
HARD TIME CONSTRAINT
Target duration: ${timeLimit} seconds
Do not significantly overrun or underrun.
`.trim()
    );
  }

  if (contextProfile) {
    const contextSection = buildContextSection(contextProfile);
    if (contextSection) sections.push(contextSection);
  }

  if (extraPrompt) {
    sections.push(
      `
ADDITIONAL CREATIVE DIRECTION
${extraPrompt}
`.trim()
    );
  }

  sections.push(GLOBAL_SAFETY_RULES.trim());
  sections.push(SCENE_STRUCTURE_FORMAT.trim());

  return sections.join('\n\n');
}
