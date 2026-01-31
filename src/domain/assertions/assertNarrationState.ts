import { ConflictError } from '@middleware/error/index.js';
import { StoryNarration } from '@models/Narration.js';

function assertNarrationNotDeleted(narration: StoryNarration): void {
  if (narration.deletedAt) {
    throw new ConflictError('Cannot perform operation on deleted narration');
  }
}

function assertNarrationIsDeleted(narration: StoryNarration): void {
  if (!narration.deletedAt) {
    throw new ConflictError('Narration is not deleted');
  }
}

export { assertNarrationNotDeleted, assertNarrationIsDeleted };
