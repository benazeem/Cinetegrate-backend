import { ConflictError } from '@middleware/error/index.js';
import { Story } from '@models/Story.js';

export function assertStoryNotDeleted(story: Story): void {
  if (story.status === 'delete' || story.deletedAt) {
    throw new ConflictError('Cannot operate on deleted story');
  }
}

export function assertStoryIsDeleted(story: Story): void {
  if (story.status !== 'delete' || !story.deletedAt) {
    throw new ConflictError('Story is not deleted');
  }
}

export function assertStoryIsActive(story: Story): void {
  if (story.status !== 'active' || story.deletedAt) {
    throw new ConflictError('Story is not active');
  }
}

export function assertStoryIsArchived(story: Story): void {
  if (story.status !== 'archive') {
    throw new ConflictError('Story is not archived');
  }
}

export function assertStoryNotArchived(story: Story): void {
  if (story.status === 'archive') {
    throw new ConflictError('Story is archived');
  }
}
