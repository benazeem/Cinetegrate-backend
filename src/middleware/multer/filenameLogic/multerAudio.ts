import multer from 'multer';
import { BadRequestError } from '../../error/index.js';

const allowedExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.wma', '.opus'];

const allowedMimetypes = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/flac',
  'audio/x-flac',
  'audio/x-ms-wma',
  'audio/opus',
];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimetypes.includes(file.mimetype)) {
    cb(new BadRequestError('Only audio files (mp3, wav, ogg, aac, m4a, flac, wma, opus) are allowed'));
    return;
  }

  const lastDotIndex = file.originalname.lastIndexOf('.');

  if (lastDotIndex < 0) {
    cb(new BadRequestError('Only audio files (mp3, wav, ogg, aac, m4a, flac, wma, opus) are allowed'));
    return;
  }

  const fileExtension = file.originalname.substring(lastDotIndex).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    cb(new BadRequestError('Only audio files (mp3, wav, ogg, aac, m4a, flac, wma, opus) are allowed'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
