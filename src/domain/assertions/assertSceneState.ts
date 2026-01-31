import { Scene } from '@models/Scene.js';
import { ConflictError } from '@middleware/error/index.js';

export function assertSceneNotDeleted(scene: Scene): void {
  if (scene.deletedAt) {
    throw new ConflictError('Cannot perform operation on deleted scene');
  }
}

export function assertSceneIsDeleted(scene: Scene): void {
  if (!scene.deletedAt) {
    throw new ConflictError('Scene is not deleted');
  }
}

export function assertSceneIsActive(scene: Scene): void {
  if (scene.deletedAt || scene.active === false) {
    throw new ConflictError('Scene is not active');
  }
}

export function assertSceneIsInactive(scene: Scene): void {
  if (scene.active === true && !scene.deletedAt) {
    throw new ConflictError('Scene is not inactive');
  }
}

export function assertHasDeletedScenes(scenes: Scene[]): void {
  if (scenes.length === 0) {
    throw new ConflictError('No deleted scenes found');
  }
}

export function assertHasNonDeletedScenes(scenes: Scene[]): void {
  if (scenes.length === 0) {
    throw new ConflictError('No non-deleted scenes found');
  }
}

export function assertHasActiveScenes(scenes: Scene[]): void {
  if (scenes.length === 0) {
    throw new ConflictError('No active scenes found');
  }
}
