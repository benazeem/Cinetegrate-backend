import { ContextProfile } from "@models/ContextProfile.js";
import { GLOBAL_SAFETY_RULES } from "../constants/globalSafetyRules.js";
import { STORY_GENERATION_FORMAT } from "../constants/storyGenerationFormat.js";
import { buildStoryContextSection } from "./utils/buildStoryContextSection.js";
import { calculateWordLimits } from "../constants/calculateWordLimits.js";
import { Platform, StoryIntent } from "@constants/storyConsts.js";

type GenerateStoryPromptInput = {
  title: string;
  description: string;
  intent: StoryIntent;
  platform: Platform;
  timeLimit?: number; // seconds
  contextProfile?: ContextProfile | null;
  extraPrompt?: string;
};

export function generateStoryPrompt({
  title,
  description,
  timeLimit,
  contextProfile, 
}: GenerateStoryPromptInput): string {
  const sections: string[] = [];

  /* 1. ROLE (STRICT) */
  sections.push(`
You are a professional fiction writer.
You write with precision and restraint.
You must follow all constraints exactly.
Do not explain your reasoning.
`.trim());

  /* 2. STORY BRIEF */
  sections.push(`
STORY BRIEF
Title: "${title}"
Description: "${description}"
`.trim());

  /* 3. HARD TIME / LENGTH CONSTRAINT */
  if (timeLimit) {
  const { targetWords, minWords, maxWords } =
    calculateWordLimits(timeLimit, contextProfile?.narrationProfile);

  sections.push(`
HARD LENGTH CONSTRAINT (ABSOLUTE)

- Target length: ${targetWords} words
- Minimum length: ${minWords} words
- Maximum length: ${maxWords} words

Rules:
- The story MUST stay within this range
- Being shorter or longer is a FAILURE
- If necessary, compress or expand minimally to fit
`.trim());
}


  /* 4. CONTEXT PROFILE (BINDING, NO EXPANSION) */
  if (contextProfile) {
    const contextSection = buildStoryContextSection(contextProfile);
if (contextSection) {
  sections.push(contextSection);
}
  }

  /* 5. GLOBAL SAFETY RULES (ABSOLUTE) */
  sections.push(GLOBAL_SAFETY_RULES.trim());

  /* 6. OUTPUT FORMAT (STRICT JSON) */
  sections.push(STORY_GENERATION_FORMAT.trim());

  return sections.join("\n\n");
}
