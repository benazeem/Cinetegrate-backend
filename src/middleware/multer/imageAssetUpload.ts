import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from './filenameLogic/multerImage.js';
import { BadRequestError, PayloadTooLargeError } from '../error/index.js';

export const imageAssetUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('sceneImage')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new PayloadTooLargeError('Avatar file size exceeds the 2MB limit', err));
      }
      return next(new BadRequestError('Multer error during file upload', { cause: err }));
    }
    return next(err);
  });
};
