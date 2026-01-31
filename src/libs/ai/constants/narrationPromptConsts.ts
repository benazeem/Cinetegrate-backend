export const FULL_STORY_NARRATION_STRUCTURE_FORMAT = `
OUTPUT FORMAT (STRICT JSON)

Return ONLY valid JSON with this exact structure:

{
  "totalDuration": number,
  "wordsPerSecond": number,
  "narrationSegments": [
    {
      "startTime": number,
      "endTime": number,
      "duration": number,
      "targetWordCount": number,
      "minWords": number,
      "maxWords": number,
      "character": "Character name for this segment",
      "narration": "Narration text for this time segment"
    }
  ]
}

Rules:
- totalDuration MUST equal the full story duration
- narrationSegments MUST cover the entire timeline with no gaps
- Each segment must respect its timing and word constraints
- Narration must fit inside its time window
- No extra keys
- No markdown
- No explanations
- No commentary
- JSON only
- Output must be directly machine-parseable
`;
