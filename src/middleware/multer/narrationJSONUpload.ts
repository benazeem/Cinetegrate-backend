import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadJSON } from './filenameLogic/multerJSON.js';
import { BadRequestError,  PayloadTooLargeError } from '../error/index.js';

export const narrationJSONUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadJSON.single('narrationFile')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new PayloadTooLargeError('JSON file size exceeds the 2MB limit', err));
      }
      return next(new BadRequestError('Multer error during JSON upload', { cause: err }));
    }

    return next(err);
  });
};
