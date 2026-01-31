import { NotFoundError } from '@middleware/error/index.js';
import { ContextProfileModel } from '@models/ContextProfile.js';

export async function getContextProfileService(userId: string, contextId: string) {
  const context = await ContextProfileModel.findOne({
    _id: contextId,
    userId,
  });

  if (!context) throw new NotFoundError('Context not found');
  return context;
}

export async function listContextProfilesService(userId: string, query: any) {
  const filter: any = { userId };

  if (query.scope) filter.scope = query.scope;
  if (query.projectId) filter.projectId = query.projectId;

  return ContextProfileModel.find(filter).sort({ updatedAt: -1 });
}
