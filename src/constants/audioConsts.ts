// Audio generation configuration
export const DEFAULT_VOICE_STABILITY = 0.5;
export const DEFAULT_VOICE_SIMILARITY_BOOST = 0.75;
export const DEFAULT_VOICE_STYLE = 0;
export const DEFAULT_USE_SPEAKER_BOOST = true;

// Supported TTS providers
export const TTS_PROVIDERS = ['elevenlabs', 'openai', 'azure', 'google'] as const;
export type TTSProvider = (typeof TTS_PROVIDERS)[number];

// Default provider
export const DEFAULT_TTS_PROVIDER: TTSProvider = 'elevenlabs';

// Audio quality settings
export const AUDIO_OUTPUT_FORMAT = 'mp3_44100_128' as const;
export const AUDIO_SAMPLE_RATE = 44100;
export const AUDIO_BIT_RATE = 128;

// Rate limiting
export const MAX_AUDIO_GENERATIONS_PER_DAY = 100;
export const MAX_AUDIO_GENERATIONS_PER_HOUR = 20;

// Cache TTL (in seconds)
export const AUDIO_CACHE_TTL = 86400; // 24 hours

// Version constants
export const AUDIO_VERSION_START = 1;
export const MAX_AUDIO_VERSIONS_PER_NARRATION = 100;
