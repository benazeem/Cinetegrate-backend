import mongoose from "mongoose";
import {
  ContextProfileModel,
  ContextScope,
  EnvironmentProfile,
  GenreType,
  MoodType,
  NarrativeScope,
  StyleType,
} from "@models/ContextProfile.js";
import { ProjectModel } from "@models/Project.js"; 
import { NARRATION_PROFILES } from "constants/narrationProfiles.js";

type CreateContextInput = {
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
  genre: GenreType;
  mood: MoodType;
  style: StyleType;
  narrativeScope?: NarrativeScope;
  environment: EnvironmentProfile;
  worldRules?: string;
  narrativeConstraints?: string;
  characters?: any[];
  forbiddenElements?: any[];
  makeGlobal?: boolean;
  setAsProjectDefault?: boolean;
};

 
export async function getContextProfileService(
  userId: string,
  contextId: string
) {
  const context = await ContextProfileModel.findOne({
    _id: contextId,
    userId,
  });

  if (!context) throw new Error("Context not found");
  return context;
}
 
export async function listContextProfilesService(
  userId: string,
  query: any
) {
  const filter: any = { userId };

  if (query.scope) filter.scope = query.scope;
  if (query.projectId) filter.projectId = query.projectId;

  return ContextProfileModel.find(filter).sort({ updatedAt: -1 });
}
