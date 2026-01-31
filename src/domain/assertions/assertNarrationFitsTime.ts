import { BadRequestError } from '@middleware/error/index.js';

export interface NarrationProfile {
  wordsPerSecond: number;
  minWordTolerance: number;
  maxWordTolerance: number;
}

export interface NarrationTimingInput {
  durationSeconds: number;
  narrationText: string;
  profile: NarrationProfile;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function assertNarrationFitsTime({
  durationSeconds,
  narrationText,
  profile,
}: NarrationTimingInput): void {
  const wordCount = countWords(narrationText);

  const baseWords = durationSeconds * profile.wordsPerSecond;

  const minWords = Math.floor(baseWords + profile.minWordTolerance);
  const maxWords = Math.ceil(baseWords + profile.maxWordTolerance);

  if (wordCount < minWords || wordCount > maxWords) {
    throw new BadRequestError(
      `Narration text does not fit time window.
       Duration: ${durationSeconds}s
       Allowed words: ${minWords}-${maxWords}
       Provided: ${wordCount}
       Segment text: \`${narrationText}\`
       `
    );
  }
}
