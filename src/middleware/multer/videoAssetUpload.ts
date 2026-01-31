import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from './filenameLogic/multerVideo.js';
import { BadRequestError, PayloadTooLargeError } from '../error/index.js';

export const videoAssetUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('sceneVideo')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new PayloadTooLargeError('Video file size exceeds the 50MB limit', err));
      }
      return next(new BadRequestError('Multer error during video upload', { cause: err }));
    }
    return next(err);
  });
};
