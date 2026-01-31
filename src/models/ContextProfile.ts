import { Schema, model, Document, Types } from 'mongoose';
import { features } from 'process';
import { required } from 'zod/mini';

export enum GenreType {
  HORROR = 'horror',
  PSYCHOLOGICAL_HORROR = 'psychological-horror',
  THRILLER = 'thriller',
  CRIME = 'crime',
  NOIR = 'noir',
  SCIFI = 'sci-fi',
  HARD_SCIFI = 'hard-sci-fi',
  CYBERPUNK = 'cyberpunk',
  FANTASY = 'fantasy',
  DARK_FANTASY = 'dark-fantasy',
  DRAMA = 'drama',
  HISTORICAL = 'historical',
  WAR = 'war',
  MYSTERY = 'mystery',
  ROMANCE = 'romance',
  TRAGEDY = 'tragedy',
  ADVENTURE = 'adventure',
  POST_APOCALYPTIC = 'post-apocalyptic',
}

export enum ToneType {
  DARK = 'dark',
  BLEAK = 'bleak',
  GRITTY = 'gritty',
  NEUTRAL = 'neutral',
  HOPEFUL = 'hopeful',
  INTIMATE = 'intimate',
  EPIC = 'epic',
  SURREAL = 'surreal',
  SOMBER = 'somber',
}

export enum MoodType {
  EERIE = 'eerie',
  TENSE = 'tense',
  CALM = 'calm',
  MELANCHOLIC = 'melancholic',
  OMINOUS = 'ominous',
  LONELY = 'lonely',
  PARANOID = 'paranoid',
  DESPERATE = 'desperate',
  HOPELESS = 'hopeless',
  BITTERSWEET = 'bittersweet',
}

export enum StyleType {
  CINEMATIC = 'cinematic',
  POETIC = 'poetic',
  MINIMAL = 'minimal',
  LITERARY = 'literary',
  GRITTY_REALISM = 'gritty-realism',
  EXPERIMENTAL = 'experimental',
  VOICEOVER_HEAVY = 'voiceover-heavy',
}

export enum EnvironmentType {
  APARTMENT = 'apartment',
  MOTEL = 'motel',
  CITY = 'city',
  MEGACITY = 'megacity',
  SUBURB = 'suburb',
  FOREST = 'forest',
  DESERT = 'desert',
  MOUNTAINS = 'mountains',
  SPACE_STATION = 'space-station',
  SPACESHIP = 'spaceship',
  UNDERGROUND = 'underground',
  BUNKER = 'bunker',
  VILLAGE = 'village',
  ABANDONED_FACILITY = 'abandoned-facility',
  OCEAN = 'ocean',
}

export enum CameraMotion {
  STATIC = 'static',
  SLOW_PAN = 'slow-pan',
  DOLLY = 'dolly',
  HANDHELD = 'handheld',
  STEADICAM = 'steadicam',
  TRACKING = 'tracking',
  DRIFTING = 'drifting',
}

export enum IntensityCurve {
  FLAT = 'flat',
  RISING = 'rising',
  SLOW_BURN = 'slow-burn',
  PULSED = 'pulsed',
  SPIKING = 'spiking',
  COLLAPSING = 'collapsing',
}

export enum NarrativeScope {
  INTIMATE = 'intimate',
  LOCAL = 'local',
  REGIONAL = 'regional',
  EPIC = 'epic',
}

export enum ContextScope {
  PROJECT = 'project',
  GLOBAL = 'global',
}

export interface EnvironmentProfile {
  type: EnvironmentType;
  cameraMotion: CameraMotion;
  description?: string;
}

export interface NarrationProfile {
  wordsPerSecond: number;
  minWordTolerance: number;
  maxWordTolerance: number;

  pauseBias: 'none' | 'low' | 'medium' | 'high';
  sentenceLengthBias: 'very-short' | 'short' | 'medium' | 'long';
  clauseDensity: 'sparse' | 'balanced' | 'dense';

  tone: ToneType;
  emotionBias: 'flat' | 'subtle' | 'expressive';
  intensityCurve: IntensityCurve;
}

export interface ForbiddenElement {
  label: string;
  severity: 'hard' | 'soft';
}

export interface ContextProfile extends Document {
  userId: Types.ObjectId;

  projectId?: Types.ObjectId;
  scope: ContextScope;
  isDefaultForProject: boolean;
  parentContextId: Types.ObjectId;

  name: string;
  description?: string;
  language?: string;

  genre: GenreType;
  mood: MoodType;
  style: StyleType;
  narrativeScope: NarrativeScope;

  environment: EnvironmentProfile;

  worldRules?: string;
  narrativeConstraints?: string;

  characters?: {
    name: string;
    description?: string;
    imageUrl?: string;
    features?: Record<string, any>;
    behaviors?: Record<string, any>;
  }[];

  forbiddenElements?: ForbiddenElement[];

  narrationProfile: NarrationProfile; // 🔒 SYSTEM-DERIVED

  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contextProfileSchema = new Schema<ContextProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },

    scope: {
      type: String,
      enum: Object.values(ContextScope),
      default: ContextScope.PROJECT,
      required: true,
    },

    isDefaultForProject: {
      type: Boolean,
      default: false,
    },
    parentContextId: {
      type: Schema.Types.ObjectId,
      ref: 'ContextProfile',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 600,
    },
    language: {
      type: String,
      default: 'en',
    },
    genre: {
      type: String,
      enum: Object.values(GenreType),
      required: true,
    },

    mood: {
      type: String,
      enum: Object.values(MoodType),
      required: true,
    },

    style: {
      type: String,
      enum: Object.values(StyleType),
      required: true,
    },

    narrativeScope: {
      type: String,
      enum: Object.values(NarrativeScope),
      default: NarrativeScope.LOCAL,
      required: true,
    },

    environment: {
      type: {
        type: String,
        enum: Object.values(EnvironmentType),
        required: true,
      },
      cameraMotion: {
        type: String,
        enum: Object.values(CameraMotion),
        required: true,
      },
      description: String,
    },

    worldRules: {
      type: String,
      maxlength: 1000,
    },

    narrativeConstraints: {
      type: String,
      maxlength: 1000,
    },

    characters: [
      {
        name: { type: String, required: true },
        imageUrl: { type: String },
        description: { type: String, maxlength: 500, required: true },
        features: { type: Schema.Types.Mixed },
        behaviors: { type: Schema.Types.Mixed },
      },
    ],

    forbiddenElements: [
      {
        label: String,
        severity: {
          type: String,
          enum: ['hard', 'soft'],
          default: 'hard',
        },
      },
    ],

    narrationProfile: {
      wordsPerSecond: { type: Number, required: true },
      minWordTolerance: { type: Number, required: true },
      maxWordTolerance: { type: Number, required: true },

      pauseBias: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
        required: true,
      },

      sentenceLengthBias: {
        type: String,
        enum: ['very-short', 'short', 'medium', 'long'],
        required: true,
      },

      clauseDensity: {
        type: String,
        enum: ['sparse', 'balanced', 'dense'],
        required: true,
      },

      tone: {
        type: String,
        enum: Object.values(ToneType),
        required: true,
      },

      emotionBias: {
        type: String,
        enum: ['flat', 'subtle', 'expressive'],
        required: true,
      },

      intensityCurve: {
        type: String,
        enum: Object.values(IntensityCurve),
        required: true,
      },
    },
    lastUsedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

contextProfileSchema.index({ projectId: 1, isDefaultForProject: 1 });
contextProfileSchema.index({ parentContextId: 1 });
contextProfileSchema.index({ userId: 1, lastUsedAt: -1 });

export const ContextProfileModel = model<ContextProfile>('ContextProfile', contextProfileSchema);
