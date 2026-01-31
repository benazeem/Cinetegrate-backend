import { ContextProfile } from '@models/ContextProfile.js';

export function buildContextSection(contextProfile?: ContextProfile | null): string | null {
  if (!contextProfile) return null;

  const lines: string[] = [];

  lines.push(
    `
STORY CONTEXT (BINDING — DO NOT INTERPRET, DO NOT EXPAND, DO NOT OVERRIDE)
This section defines immutable narrative and stylistic constraints.
Violating any rule here is considered an error.
`.trim()
  );

  // Core narrative identity
  lines.push(
    `
CORE IDENTITY
Genre: ${contextProfile.genre}
Mood: ${contextProfile.mood}
Style: ${contextProfile.style}
Narrative Scope: ${contextProfile.narrativeScope}
`.trim()
  );

  // Environment (cinematic grounding)
  if (contextProfile.environment) {
    lines.push(
      `
ENVIRONMENT
Type: ${contextProfile.environment.type}
Camera Motion: ${contextProfile.environment.cameraMotion}
${contextProfile.environment.description ? `Notes: ${contextProfile.environment.description}` : ''}
`.trim()
    );
  }

  // World rules (hard constraints)
  if (contextProfile.worldRules) {
    lines.push(
      `
WORLD RULES (ABSOLUTE — MUST NOT BE VIOLATED)
${contextProfile.worldRules}
`.trim()
    );
  }

  // Narrative constraints
  if (contextProfile.narrativeConstraints) {
    lines.push(
      `
NARRATIVE CONSTRAINTS (BINDING)
${contextProfile.narrativeConstraints}
`.trim()
    );
  }

  // Characters (locked set)
  if (contextProfile.characters?.length) {
    lines.push(
      `
CHARACTERS (LOCKED SET — DO NOT ADD, REMOVE, RENAME, OR MERGE)
${contextProfile.characters.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')}
`.trim()
    );
  }

  // Forbidden elements (negative space)
  if (contextProfile.forbiddenElements?.length) {
    lines.push(
      `
FORBIDDEN ELEMENTS (STRICT)
You must not include, imply, or reference these.

${contextProfile.forbiddenElements
  .map((f) => `- ${f.label} (${f.severity === 'hard' ? 'ABSOLUTE BAN' : 'STRONGLY DISCOURAGED'})`)
  .join('\n')}
`.trim()
    );
  }

  // Narration profile — stylistic only (NO NUMBERS)
  const np = contextProfile.narrationProfile;

  lines.push(
    `
NARRATION STYLE (QUALITATIVE — DO NOT OUTPUT NUMBERS)

Tone: ${np.tone}
Emotional Expression: ${np.emotionBias}
Intensity Curve: ${np.intensityCurve}

Pacing Behavior:
- Pause Bias: ${np.pauseBias}
- Sentence Length: ${np.sentenceLengthBias}
- Clause Density: ${np.clauseDensity}

Rules:
- These define HOW the narration should feel
- Do NOT reveal or invent numeric pacing values
- Do NOT explain these rules in the output
`.trim()
  );

  return lines.join('\n\n');
}
