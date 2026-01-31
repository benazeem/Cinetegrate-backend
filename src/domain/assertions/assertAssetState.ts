import { ConflictError } from '@middleware/error/index.js';
import { SceneAsset } from '@models/SceneAssets.js';

function assertAssetNotDeleted(asset: SceneAsset): void {
  if (asset.deletedAt) {
    throw new ConflictError('Cannot perform operation on deleted asset');
  }
}

function assertAssetIsDeleted(asset: SceneAsset): void {
  if (!asset.deletedAt) {
    throw new ConflictError('Asset is not deleted');
  }
}

function assertHasDeletedAssets(assets: SceneAsset[]): void {
  if (assets.length === 0) {
    throw new ConflictError('No deleted assets exists');
  }
}

function assertHasNonDeletedAssets(assets: SceneAsset[]): void {
  if (assets.length === 0) {
    throw new ConflictError('No assets to delete');
  }
}

export { assertAssetNotDeleted, assertAssetIsDeleted, assertHasDeletedAssets, assertHasNonDeletedAssets };
