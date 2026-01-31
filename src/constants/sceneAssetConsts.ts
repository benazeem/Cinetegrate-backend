// Scene Asset validation constants
export const MAX_ASSET_PROMPT_LENGTH = 2000;
export const MAX_ASSET_URL_LENGTH = 2048;
export const MAX_ASSETS_PER_SCENE = 50;

// Asset types
export const assetTypes = ['image', 'video'] as const;
export type AssetType = (typeof assetTypes)[number];

// Visibility types
export const visibilityTypes = ['private', 'public'] as const;
export type VisibilityType = (typeof visibilityTypes)[number];

// Generation sources
export const generationSources = ['ai', 'user'] as const;
export type GenerationSource = (typeof generationSources)[number];

// Supported formats
export const videoFormats = ['mp4', 'mov', 'mkv', 'mpg', 'webm', 'avi', 'ogg', 'mpeg', 'm4v', 'flv', 'wmv', '3gp'] as const;
export const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'ico', 'heic', 'raw'] as const;
export const allFormats = [...videoFormats, ...imageFormats] as const;

export type VideoFormat = (typeof videoFormats)[number];
export type ImageFormat = (typeof imageFormats)[number];
export type AssetFormat = (typeof allFormats)[number];

// Dimension constraints
export const MIN_DIMENSION = 1;
export const MAX_DIMENSION = 8192;

// Duration constraints (for video assets)
export const MIN_ASSET_DURATION = 0.1;
export const MAX_ASSET_DURATION = 3600; // 1 hour max
