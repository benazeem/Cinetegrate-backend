import { InternalServerError } from '@middleware/error/index.js';
import ffmpeg from 'fluent-ffmpeg';

export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(new InternalServerError('FFPROBE_FAILED'));
      }

      const duration = metadata?.format?.duration;

      if (typeof duration !== 'number' || Number.isNaN(duration) || duration <= 0) {
        return reject(new InternalServerError('INVALID_VIDEO_DURATION'));
      }

      resolve(duration);
    });
  });
}
