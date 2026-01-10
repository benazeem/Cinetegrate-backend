import { NarrationProfile } from "@models/ContextProfile.js";

type WordLimitResult = {
  targetWords: number;
  minWords: number;
  maxWords: number;
};

const DEFAULT_WPS = 2.2;
const DEFAULT_MIN_TOLERANCE = 10;
const DEFAULT_MAX_TOLERANCE = 10;

export function calculateWordLimits(
  timeLimitSeconds: number,
  narrationProfile?: NarrationProfile | null
): WordLimitResult {
  const wordsPerSecond =
    narrationProfile?.wordsPerSecond ?? DEFAULT_WPS;

  const minTolerance =
    narrationProfile?.minWordTolerance ?? DEFAULT_MIN_TOLERANCE;

  const maxTolerance =
    narrationProfile?.maxWordTolerance ?? DEFAULT_MAX_TOLERANCE;

  const targetWords = Math.round(timeLimitSeconds * wordsPerSecond);

  const minWords = Math.max(1, targetWords - minTolerance);
  const maxWords = Math.max(minWords, targetWords + maxTolerance);

  return {
    targetWords,
    minWords,
    maxWords,
  };
}
