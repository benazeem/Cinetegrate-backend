import { Platform, StoryIntent } from '@constants/storyConsts.js';
import { ContextProfile } from "@models/ContextProfile.js";
import { GLOBAL_SAFETY_RULES } from "libs/ai/constants/globalSafetyRules.js";
import { STORY_GENERATION_FORMAT } from "../constants/storyGenerationFormat.js";
import { buildStoryContextSection } from "./utils/buildStoryContextSection.js";
import { calculateWordLimits } from "../constants/calculateWordLimits.js";

type RegenerateStoryPromptInput = {
  title: string;
  description: string;
  existingSummary: string;
  intent: StoryIntent;
  platform: Platform;
  timeLimit?: number; // seconds
  extraPrompt: string;
  contextProfile?: ContextProfile | null;
};

export function generateStoryRegenerationPrompt({
  title,
  description,
  existingSummary,
  timeLimit,
  contextProfile,
  extraPrompt,
}: RegenerateStoryPromptInput): string {
  const sections: string[] = [];

  /* 1. ROLE (CONTROLLED CREATION) */
  sections.push(`
You are a professional fiction writer and editor.
You write with discipline, restraint, and precision.
You must follow all constraints exactly.
Do not explain your reasoning.
`.trim());

  /* 2. FIXED STORY ANCHORS (DO NOT CHANGE) */
  sections.push(`
STORY ANCHORS (REFERENCE ONLY — DO NOT CHANGE)

Title: "${title}"
Description: "${description}"

Existing Summary (intent reference only):
${existingSummary}
`.trim());

  /* 3. REGENERATION TASK */
  sections.push(`
REGENERATION TASK (MANDATORY)

You must regenerate the story based on the anchors above.

Rules:
- Preserve the core premise implied by the title and description
- Preserve the narrative intent of the summary
- Do NOT invent unrelated plotlines
- Do NOT add unnecessary exposition
- Prefer concise, efficient storytelling
- Brevity is a priority
`.trim());

  /* 4. USER REQUEST */
  sections.push(`
USER REQUESTED CHANGES (ONLY THESE)

${extraPrompt}
`.trim());
 
  /* 5. HARD TIME / LENGTH CONSTRAINT */
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

  /* 7. GLOBAL SAFETY RULES (ABSOLUTE) */
  sections.push(GLOBAL_SAFETY_RULES.trim());

  /* 8. OUTPUT FORMAT (STRICT JSON) */
  sections.push(STORY_GENERATION_FORMAT.trim());

  return sections.join("\n\n");
}
