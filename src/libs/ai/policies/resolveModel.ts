import { BadRequestError } from '@middleware/error/index.js';
import type { AIMode, Plan } from 'types/index.js';

type ModelConfig =
  | {
      provider: 'openai' | 'anthropic' | 'google' | 'elevenlabs' | 'runway' | 'veo' | 'sora' | 'sdxl';
      model: string;
    }
  | (Record<string, any> & { provider: string; model: string });

export function resolveModelConfig(mode: AIMode, plan: Plan): ModelConfig {
  switch (mode) {
    case 'story':
      return resolveStoryModel(plan);

    case 'scenes':
      return resolveScenesModel(plan);

    case 'narration_text':
      return resolveNarrationTextModel(plan);

    case 'narration_audio':
      return resolveNarrationAudioModel(plan);

    case 'image_text':
      return resolveImageTextModel(plan);

    case 'image_image':
      return resolveImageFromImageModel(plan);

    case 'video_image':
      return resolveImageToVideoModel(plan);

    case 'video_text':
      return resolveTextToVideoModel(plan);

    default:
      throw new Error(`Unsupported AI mode: ${mode}`);
  }
}

function resolveStoryModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      return { provider: 'openai', model: 'gpt-4o-mini' };

    case 'pro_basic':
      return { provider: 'anthropic', model: 'claude-3.5-sonnet' };

    case 'pro_standard':
      return { provider: 'openai', model: 'gpt-4o' };

    case 'premium_standard':
    case 'premium_best':
      return { provider: 'anthropic', model: 'claude-3-opus' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}

function resolveScenesModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      return { provider: 'google', model: 'gemini-1.5-flash' };

    case 'pro_basic':
      return { provider: 'openai', model: 'gpt-4o' };

    case 'pro_standard':
      return { provider: 'google', model: 'gemini-1.5-pro' };

    case 'premium_standard':
    case 'premium_best':
      return { provider: 'openai', model: 'o3' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}

function resolveNarrationTextModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      return { provider: 'openai', model: 'gpt-4o-mini' };

    case 'pro_basic':
      return { provider: 'anthropic', model: 'claude-3.5-sonnet' };

    case 'pro_standard':
      return { provider: 'openai', model: 'gpt-4o' };

    case 'premium_standard':
    case 'premium_best':
      return { provider: 'anthropic', model: 'claude-3-opus' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}

function resolveImageTextModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      return { provider: 'sdxl', model: 'stable-diffusion-xl' };

    case 'pro_basic':
      return { provider: 'google', model: 'imagen-3' };

    case 'pro_standard':
    case 'premium_standard':
    case 'premium_best':
      return { provider: 'openai', model: 'gpt-image-1' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}

function resolveImageFromImageModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      throw new Error('Image-to-image is not available for free users');

    case 'pro_basic':
      return {
        provider: 'google',
        model: 'imagen-3',
      };

    case 'pro_standard':
      return {
        provider: 'openai',
        model: 'gpt-image-1',
      };

    case 'premium_standard':
      return {
        provider: 'openai',
        model: 'gpt-image-1',
      };

    case 'premium_best':
      return {
        provider: 'openai',
        model: 'gpt-image-1',
      };
  }
}

function resolveNarrationAudioModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      return { provider: 'openai', model: 'gpt-4o-mini-audio' };

    case 'pro_basic':
      return { provider: 'openai', model: 'gpt-4o-audio' };

    case 'pro_standard':
      return { provider: 'openai', model: 'gpt-realtime' };

    case 'premium_standard':
      return { provider: 'openai', model: 'gpt-4o-realtime-preview' };

    case 'premium_best':
      return { provider: 'elevenlabs', model: 'eleven_multilingual_v2' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}

function resolveImageToVideoModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
      throw new BadRequestError('Video not available for Free plan');

    case 'pro_basic':
    case 'pro_standard':
      return { provider: 'runway', model: 'gen4_turbo' };

    case 'premium_standard':
      return { provider: 'veo', model: 'veo-3.1-fast' };

    case 'premium_best':
      return { provider: 'sora', model: 'sora-2-pro' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}

function resolveTextToVideoModel(plan: Plan): ModelConfig {
  switch (plan) {
    case 'free':
    case 'pro_basic':
      throw new BadRequestError('Text-to-video not available for this plan');

    case 'pro_standard':
      return { provider: 'runway', model: 'gen4_aleph' };

    case 'premium_standard':
      return { provider: 'veo', model: 'veo-3.1' };

    case 'premium_best':
      return { provider: 'sora', model: 'sora-2-pro-hd' };
    default:
      throw new Error(`Unsupported plan: ${plan}`);
  }
}
