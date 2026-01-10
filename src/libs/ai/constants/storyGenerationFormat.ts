// storyGenerationFormat.ts
// Single source of truth for ALL story-generation output contracts.
// This is intentionally strict and reusable across generation & regeneration.

export const STORY_GENERATION_FORMAT = `
OUTPUT FORMAT (STRICT JSON — MACHINE CONSUMABLE)

Return ONLY valid JSON in exactly this structure:

{
  "story": "Complete story text within the specified word limit",
  "summary": "Concise 2–4 sentence summary of the story",
  "tags": ["short", "lowercase", "hashtags"],
  "keywords": ["search friendly", "descriptive"]
}

MANDATORY RULES:
- Output MUST be valid JSON
- Do NOT include markdown
- Do NOT include code fences
- Do NOT include explanations or commentary
- Do NOT include extra fields
- Keys must match EXACTLY as specified
- Arrays must contain strings only
- Tags must be short, lowercase, and suitable for social media
- Keywords must be search-friendly and descriptive
- Word/time limits defined elsewhere MUST be respected
- Violating this format is a failure
`;