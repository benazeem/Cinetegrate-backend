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
          new PayloadTooLargeError(
            "Avatar file size exceeds the 2MB limit",
            err
          )
        );
      }
      return next(new Error("Multer error during file upload", { cause: err }));
    }
    return next(err);
  });
};
