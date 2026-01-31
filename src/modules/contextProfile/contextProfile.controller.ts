import { Request, Response } from "express";
import {
  getContextProfileService,
  listContextProfilesService,
} from "./contextProfile.service.js";

export async function getContextProfileController(req: Request, res: Response) {
  const context = await getContextProfileService(
    req.user!.id,
    req.params.contextId
  );

  res.json({ data: context });
}

export async function listContextProfilesController(
  req: Request,
  res: Response
) {
  const contexts = await listContextProfilesService(req.user!.id, req.query);

  res.json({ data: contexts });
}
