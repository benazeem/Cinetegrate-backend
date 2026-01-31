export const SCENE_STRUCTURE_FORMAT = `
OUTPUT FORMAT (STRICT JSON)

Return ONLY valid JSON with this exact structure:

{
  "title": "Short, clear, evocative scene title",
  "description": "1–2 line high-level description of the scene’s purpose and emotional beat",
  "imagePrompt": "Highly visual, concrete, cinematic prompt for image generation",
  "videoPrompt": "Cinematic video-style prompt including camera, lighting, motion, framing, and mood",
  "duration": number
}

Rules:
- All fields are REQUIRED
- No extra keys
- No markdown
- No explanations
- No commentary
- JSON only
- Output must be directly machine-parseable
`;

export const SINGLE_SCENE_GENERATION_PROMPT = `
You are generating a NEW scene that advances the story.

Rules:
- This scene MUST move the story forward
- Introduce new developments, revelations, conflicts, or decisions
- Do NOT repeat earlier scenes
- Do NOT restate previous events unless dramatically necessary
- Maintain strict continuity
- Respect established character arcs and motivations
- Do NOT contradict past events or established facts
- Introduce new characters ONLY if the story logically requires it
- Avoid unnecessary characters
- Follow timeline logic
- Each scene must have a clear narrative purpose
- Avoid filler, stalling, or empty moments
- The scene must feel cinematic, intentional, and purposeful

You must output using the standard scene JSON format.
`;

export const SCENE_REGENERATION_PROMPT = `
OUTPUT FORMAT (STRICT JSON) 
Rules:
- Preserve continuity with the story
- Do NOT contradict prior scenes
- Do NOT introduce new story events unless explicitly instructed
- Do NOT introduce new characters unless specified
- Maintain the original scene’s narrative purpose
- Maintain character motivations and behavior
- Follow timeline logic
- Improve clarity, pacing, emotional impact, and cinematic quality
- Remove redundancy
- Tighten structure
- All fields are REQUIRED
- Output must be directly machine-parseable
`;

export const SCENE_VARIATION_PROMPT = `
You are generating a VARIATION of an existing scene.

Rules:
- The story events MUST remain the same
- The outcome MUST remain the same
- The narrative purpose MUST remain the same
- Do NOT introduce new plot points
- Do NOT remove any existing plot points
- Do NOT change story facts
- Do NOT change character roles, goals, or decisions
- Do NOT move the timeline forward or backward
- Only vary:
  - Tone
  - Mood
  - Atmosphere
  - Pacing
  - Style
  - Visual interpretation
  - Emotional intensity
  - Cinematic framing

This is a reinterpretation, NOT a rewrite of events.

You must output using the standard scene JSON format.
`;

export const MULTI_SCENE_STRUCTURE_FORMAT = `
OUTPUT FORMAT (STRICT JSON)

Return ONLY valid JSON with this exact structure:

[
  {
    "title": "Short, clear, evocative scene title",
    "description": "1–2 line high-level description of the scene’s purpose and emotional beat",
    "imagePrompt": "Highly visual, concrete, cinematic prompt for image generation",
    "videoPrompt": "Cinematic video-style prompt including camera, lighting, motion, framing, and mood",
    "duration": number
  }
]

Rules:
- Output MUST be a JSON array
- Each array item MUST follow the exact scene structure
- All fields are REQUIRED
- No extra keys
- No markdown
- No explanations
- No commentary
- JSON only
- Output must be directly machine-parseable
`;

export const MULTI_SCENE_GENERATION_PROMPT = `
You are generating MULTIPLE NEW scenes that advance the story.

Rules:
- The array length MUST equal the requested number of scenes
- Each scene MUST move the story forward
- Each scene must introduce new narrative progress
- No filler
- No repetition
- No redundant beats
- No merging scenes
- No skipping scenes
- Maintain strict continuity
- Respect established character arcs
- Follow timeline logic
- Do NOT contradict past events
- Introduce new characters ONLY if the story logically requires it
- Avoid unnecessary characters
- Each scene must be distinct in purpose, beat, and function
- Each scene must have a clear narrative role
- Avoid stalling or padding

You must output using the standard scene JSON format.
`;

export const MULTI_SCENE_REGENERATION_PROMPT = `
You are regenerating MULTIPLE scenes in the story.

Rules:
- The number of scenes MUST match the original count
- Do NOT remove or add scenes
- Preserve the overall story arc
- Maintain strict continuity across scenes
- Do NOT contradict earlier story facts
- Maintain character behavior, psychology, and tone
- Maintain each scene’s original narrative purpose
- Do NOT introduce new characters unless explicitly specified
- Process scenes one by one
- All scenes must still move the story forward
- No filler
- No repetition
- No skipping scenes
- Stay true to the original intent
- Improve clarity, pacing, structure, and cinematic quality
- Remove redundancy
- Sharpen emotional beats
- Respect character development
- Follow timeline logic
- Each scene must remain distinct
- Do NOT merge scenes
- All fields are REQUIRED
- No extra keys
- Output must be directly machine-parseable

You must output using the standard scene JSON format.
`;