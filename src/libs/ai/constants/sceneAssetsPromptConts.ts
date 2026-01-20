export const SCENE_ASSET_PROMPT_FORMAT = `
OUTPUT FORMAT (STRICT JSON)

Return ONLY valid JSON with this exact structure:

{
  "assetPrompt": "Highly detailed, cinematic generation prompt",
  "style": "Visual style (e.g. realistic, anime, cyberpunk, noir, etc.)",
  "mood": "Emotional tone (e.g. tense, calm, joyful, dark)",
  "lighting": "Lighting style (e.g. soft, neon, sunset, moody)",
  "camera": "Camera description (e.g. wide shot, close-up, drone, tracking)",
  "motion": "Describe motion if video, or 'static' if image"
}

Rules:
- No narrative
- No story text
- No scene rewriting
- Only describe the asset
- JSON only
`;