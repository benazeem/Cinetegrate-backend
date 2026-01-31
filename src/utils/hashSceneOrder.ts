import * as crypto from 'crypto';
import { Types } from 'mongoose';

export function hashSceneOrder(sceneIds: Types.ObjectId[]): string {
  const orderString = sceneIds.join('|');
  return crypto.createHash('sha256').update(orderString).digest('hex');
}

export function verifySceneOrder(sceneIds: Types.ObjectId[], hash: string): boolean {
  return hashSceneOrder(sceneIds) === hash;
}

export function shortHashSceneOrder(sceneIds: Types.ObjectId[]): string {
  return hashSceneOrder(sceneIds).substring(0, 8);
}
