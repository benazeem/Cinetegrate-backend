import { Request, Response } from 'express';
import {
  createContextProfileService,
  getContextProfileService,
  listContextProfilesService,
} from './contextProfile.service.js';
import { CreateContextProfileInput } from '@validation/contextProfile.schema.js';
import { sendSuccess } from '@shared/response.js';

export async function createContextProfileController(req: Request, res: Response) {
  const payload = req.validatedBody as CreateContextProfileInput;
  const context = await createContextProfileService(req.user!.id, payload);
  return sendSuccess(res, context, 'Context profile created successfully', 201);
}

export async function getContextProfileController(req: Request, res: Response) {
  const context = await getContextProfileService(req.user!.id, req.params.contextId);
  return sendSuccess(res, context, 'Context profile retrieved successfully');
}

export async function listContextProfilesController(req: Request, res: Response) {
  const contexts = await listContextProfilesService(req.user!.id, req.query);
  return sendSuccess(res, contexts, 'Context profiles retrieved successfully');
}
