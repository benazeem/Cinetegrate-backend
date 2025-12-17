import { Request } from "express";
import fs from "fs";
import multer from "multer";
import { BadRequestError } from "./error/index.js";

const storage = multer.diskStorage({
  destination: function (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    const uploadPath = "./temp/uploads";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdir(uploadPath, { recursive: true }, (err) => {
        if (err) {
          return cb(err, uploadPath);
        } else {
          cb(null, uploadPath);
        }
      });
    }
    cb(null, uploadPath);
  },
  filename: function (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const fileExtension = file.originalname
      .substring(file.originalname.lastIndexOf("."))
      .toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const allowedMimetypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimetypes.includes(file.mimetype)) {
    cb(
      new BadRequestError(
        "Only image files (jpg, jpeg, png, gif, webp) are allowed"
      )
    );
    return;
  }
  const lastDotIndex = file.originalname.lastIndexOf(".");

  const fileExtension = file.originalname.substring(lastDotIndex).toLowerCase();
  if (!allowedExtensions.includes(fileExtension) || lastDotIndex <= 0) {
    cb(
      new BadRequestError(
        "Only image files (jpg, jpeg, png, gif, webp) are allowed"
      )
    );
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export { upload };
