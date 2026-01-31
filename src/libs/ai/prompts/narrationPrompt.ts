import { ContextProfile } from '@models/ContextProfile.js';
import { GLOBAL_SAFETY_RULES } from '../constants/globalSafetyRules.js';
import { FULL_STORY_NARRATION_STRUCTURE_FORMAT } from '../constants/narrationPromptConsts.js';
import { Platform, StoryIntent } from '@constants/storyConsts.js';
import { StoryContent } from 'types/index.js';

type BuildFullNarrationPromptInput = {
  storyTitle: string;
  storyContent: StoryContent;
  scenes: {
    title?: string;
    description: string;
    duration?: number;
    order: number;
  }[];
  storyTimeLimit: number;
  intent: StoryIntent;
  platform: Platform;
  contextProfile?: ContextProfile | null;
  extraPrompt?: string;
};

export function buildStoryNarrationPrompt(input: BuildFullNarrationPromptInput): string {
  const { storyTitle, storyContent, scenes, storyTimeLimit, intent, platform, contextProfile, extraPrompt } =
    input;

  if (!scenes || scenes.length === 0) {
    throw new Error('Scenes are required to build narration');
  }

  const sections: string[] = [];

  const narrationProfile = contextProfile?.narrationProfile;
  const wordsPerSecond = narrationProfile?.wordsPerSecond ?? 2.5;
  const minTol = narrationProfile?.minWordTolerance ?? 0.9;
  const maxTol = narrationProfile?.maxWordTolerance ?? 1.1;

  // ROLE
  sections.push(
    `
You are a professional cinematic narrator and voiceover writer.
You write emotionally controlled, time-aware narration.
You MUST obey strict timing and word constraints.
Do not explain your reasoning.
`.trim()
  );

  // MODE
  sections.push(
    `
You are generating FULL STORY NARRATION.
This narration must follow the story exactly.
Do NOT invent new events.
Do NOT contradict scenes.
Do NOT change facts.
Do NOT summarize — narrate.
`.trim()
  );

  // CORE CONTEXT
  sections.push(
    `
STORY CONTEXT
Title: "${storyTitle}"
Summary: "${storyContent.summary}"
Platform: ${platform}
Intent: ${intent}
`.trim()
  );

  // STYLE & WORLD CONTEXT
  if (contextProfile) {
    sections.push(
      `
NARRATIVE DNA

Genre: ${contextProfile.genre}
Mood: ${contextProfile.mood}
Style: ${contextProfile.style}
Narrative Scope: ${contextProfile.narrativeScope}

Environment:
- Type: ${contextProfile.environment.type}
- Camera Motion: ${contextProfile.environment.cameraMotion}
- Description: ${contextProfile.environment.description || 'N/A'}

Tone: ${contextProfile.narrationProfile.tone}
Emotion Bias: ${contextProfile.narrationProfile.emotionBias}
Intensity Curve: ${contextProfile.narrationProfile.intensityCurve}

Sentence Length Bias: ${contextProfile.narrationProfile.sentenceLengthBias}
Clause Density: ${contextProfile.narrationProfile.clauseDensity}
Pause Bias: ${contextProfile.narrationProfile.pauseBias}
All Characters:  ${contextProfile.characters?.join(', ') || 'N/A'}
`.trim()
    );
  }

  // WORLD RULES
  if (contextProfile?.worldRules) {
    sections.push(
      `
WORLD RULES
${contextProfile.worldRules}
`.trim()
    );
  }

  if (contextProfile?.narrativeConstraints) {
    sections.push(
      `
NARRATIVE CONSTRAINTS
${contextProfile.narrativeConstraints}
`.trim()
    );
  }

  // FORBIDDEN ELEMENTS
  if (contextProfile?.forbiddenElements?.length) {
    const forbiddenList = contextProfile.forbiddenElements
      .map((f: { label: string; severity: string }) => `- ${f.label} (${f.severity})`)
      .join('\n');

    sections.push(
      `
FORBIDDEN ELEMENTS

You must NOT include or imply the following:

${forbiddenList}

Rules:
- Hard = must never appear
- Soft = avoid strongly
`.trim()
    );
  }

  // FULL STORY BODY
  if (storyContent.body) {
    sections.push(
      `
FULL STORY REFERENCE (FOR CONTINUITY ONLY)

${storyContent.body}

Rules:
- Reference only
- Do NOT rewrite
- Do NOT summarize
`.trim()
    );
  }

  // TIMELINE
  const orderedScenes = scenes.sort((a, b) => a.order - b.order);

  let currentTime = 0;
  const timelineBlocks = orderedScenes.map((scene, i) => {
    const duration = scene.duration ?? Math.floor(storyTimeLimit / scenes.length);
    const baseWords = Math.round(duration * wordsPerSecond);
    const minWords = Math.floor(baseWords * minTol);
    const maxWords = Math.ceil(baseWords * maxTol);

    const start = currentTime;
    const end = currentTime + duration;
    currentTime = end;

    return `
Segment ${i + 1}
Start: ${start}s
End: ${end}s
Duration: ${duration}s
Target Words: ~${baseWords}
Min Words: ${minWords}
Max Words: ${maxWords}
Character: [Specify character for this segment]
Scene Title: ${scene.title || 'Untitled'}
Scene Description: ${scene.description}
`.trim();
  });

  sections.push(
    `
NARRATION TIMELINE

Total Duration: ${storyTimeLimit} seconds
Speech Rate: ${wordsPerSecond} words/sec

${timelineBlocks.join('\n\n')}

Rules:
- Each segment must stay within its word limits
- No segment may overflow its time window
- No scene may be skipped
- Maintain continuity
`.trim()
  );

  // EXTRA PROMPT
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
  sections.push(FULL_STORY_NARRATION_STRUCTURE_FORMAT.trim());

  return sections.join('\n\n');
}
