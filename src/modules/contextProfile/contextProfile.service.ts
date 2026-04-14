import { BadRequestError, NotFoundError } from '@middleware/error/index.js';
import { ContextProfileModel, ContextScope, GenreType } from '@models/ContextProfile.js';
import { ProjectModel } from '@models/Project.js';
import { NARRATION_PROFILES } from '@constants/narrationProfiles.js';
import type { CreateContextProfileInput } from '@validation/contextProfile.schema.js';
import { withTransaction } from '@db/withTransaction.js';
import {
  sanitizeContextProfileResponse,
  sanitizeContextProfilesResponse,
} from '@utils/sanitizers/sanitizeContextProfileResponse.js';

export async function getContextProfileService(userId: string, contextId: string) {
  const context = await ContextProfileModel.findOne({ _id: contextId, userId });
  if (!context) throw new NotFoundError('Context not found');
  return sanitizeContextProfileResponse(context);
}

export async function listContextProfilesService(userId: string, query: any) {
  const filter: any = { userId };
  if (query.scope) filter.scope = query.scope;
  if (query.projectId) filter.projectId = query.projectId;

  const contexts = await ContextProfileModel.find(filter).sort({ updatedAt: -1 });
  return sanitizeContextProfilesResponse(contexts);
}

export async function createContextProfileService(userId: string, payload: CreateContextProfileInput) {
  const makeGlobal = payload.makeGlobal === true;

  if (!makeGlobal && !payload.projectId) {
    throw new BadRequestError('projectId is required when creating a non-global context');
  }

  if (makeGlobal && payload.setAsProjectDefault) {
    throw new BadRequestError('Global context cannot be set as project default');
  }

  return withTransaction(async (session) => {
    let project = null;
    if (!makeGlobal && payload.projectId) {
      project = await ProjectModel.findOne({ _id: payload.projectId, userId }).session(session);
      if (!project) throw new NotFoundError('Project not found');
    }

    const narrationProfile = NARRATION_PROFILES[payload.genre as GenreType];
    const [context] = await ContextProfileModel.create(
      [
        {
          userId,
          projectId: makeGlobal ? undefined : payload.projectId,
          scope: makeGlobal ? ContextScope.GLOBAL : ContextScope.PROJECT,
          isDefaultForProject: Boolean(!makeGlobal && payload.setAsProjectDefault),
          name: payload.name,
          description: payload.description,
          genre: payload.genre,
          mood: payload.mood,
          style: payload.style,
          narrativeScope: payload.narrativeScope,
          environment: payload.environment,
          worldRules: payload.worldRules,
          narrativeConstraints: payload.narrativeConstraints,
          characters: payload.characters,
          forbiddenElements: payload.forbiddenElements,
          narrationProfile,
          lastUsedAt: new Date(),
        },
      ],
      { session }
    );

    if (!makeGlobal && payload.setAsProjectDefault && project) {
      await ContextProfileModel.updateMany(
        { userId, projectId: project._id, _id: { $ne: context._id }, isDefaultForProject: true },
        { $set: { isDefaultForProject: false } }
      ).session(session);

      project.defaultContextProfileId = context._id;
      if (project.status === 'draft') {
        project.status = 'active';
      }
      await project.save({ session });
    }

    return sanitizeContextProfileResponse(context);
  });
}
