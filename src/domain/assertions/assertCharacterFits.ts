import { BadRequestError } from '@middleware/error/index.js';
import { ContextProfile } from '@models/ContextProfile.js';
import { NarrationSegment } from '@models/Narration.js';

export function assertCharacterFits(segments: NarrationSegment[], context: ContextProfile): void {
  const hasContextCharacters = Array.isArray(context.characters) && context.characters.length > 0;

  const allowedNames = hasContextCharacters
    ? new Set(context.characters!.map((c) => c.name.toLowerCase().trim()))
    : null;

  for (const seg of segments) {
    if (seg.character === undefined || seg.character === null) {
      continue;
    }

    if (typeof seg.character !== 'string' || seg.character.trim() === '') {
      throw new BadRequestError('Invalid character reference in narration segment');
    }

    if (!hasContextCharacters) {
      throw new BadRequestError('This story has no characters defined, but narration references a character');
    }

    const normalized = seg.character.toLowerCase().trim();

    if (!allowedNames!.has(normalized)) {
      throw new BadRequestError(`Character "${seg.character}" is not part of the story context`);
    }
  }
}
