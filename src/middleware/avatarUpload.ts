import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { upload } from "./multer.js";
import { PayloadTooLargeError } from "./error/index.js";

export const avatarUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single("avatar")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new PayloadTooLargeError("Avatar file size exceeds the limit", err)
        );
      }
      return res.status(400).json({
        message: err.message,
      });
    }

    return next(err);
  });
};
