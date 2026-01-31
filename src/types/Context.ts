import {
  EnvironmentProfile,
  GenreType,
  MoodType,
  NarrativeScope,
  StyleType,
} from "@models/ContextProfile.js";

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
