import { ContextProfile } from "@models/ContextProfile.js";

export function buildStoryContextSection(
  contextProfile?: ContextProfile | null
): string | null {
  if (!contextProfile) return null;

  const lines: string[] = [];

  lines.push(`
STORY CONTEXT (BINDING — DO NOT EXPAND OR INTERPRET)
`.trim());

  // Core narrative identity
  lines.push(`Genre: ${contextProfile.genre}`);
  lines.push(`Mood: ${contextProfile.mood}`);
  lines.push(`Style: ${contextProfile.style}`);
  lines.push(`Narrative Scope: ${contextProfile.narrativeScope}`);

  // Environment (cinematic grounding)
  if (contextProfile.environment) {
    lines.push(
      `Environment: ${contextProfile.environment.type} (${contextProfile.environment.cameraMotion})`
    );

    if (contextProfile.environment.description) {
      lines.push(
        `Environment Notes: ${contextProfile.environment.description}`
      );
    }
  }

  // World rules (hard constraints)
  if (contextProfile.worldRules) {
    lines.push(`
WORLD RULES (MUST NOT BE VIOLATED)
${contextProfile.worldRules}`.trim());
  }

  // Narrative constraints
  if (contextProfile.narrativeConstraints) {
    lines.push(`
NARRATIVE CONSTRAINTS (BINDING)
${contextProfile.narrativeConstraints}`.trim());
  }

  // Characters (locked set)
  if (contextProfile.characters?.length) {
    lines.push(`
CHARACTERS (DO NOT ADD, REMOVE, OR RENAME)
${contextProfile.characters
      .map(
        (c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`
      )
      .join("\n")}`.trim());
  }

  // Forbidden elements (negative space)
  if (contextProfile.forbiddenElements?.length) {
    lines.push(`
FORBIDDEN ELEMENTS (STRICT)
${contextProfile.forbiddenElements
      .map((f) => `- ${f.label} (${f.severity})`)
      .join("\n")}`.trim());
  }

  // Narration profile (STYLE ONLY — NOT NUMBERS)
  lines.push(`
NARRATION STYLE (DO NOT EXPOSE NUMBERS)
Tone: ${contextProfile.narrationProfile.tone}
Emotion Bias: ${contextProfile.narrationProfile.emotionBias}
Intensity Curve: ${contextProfile.narrationProfile.intensityCurve}
Pause Bias: ${contextProfile.narrationProfile.pauseBias}
Sentence Length Bias: ${contextProfile.narrationProfile.sentenceLengthBias}
Clause Density: ${contextProfile.narrationProfile.clauseDensity}
`.trim());

  return lines.join("\n\n");
}
