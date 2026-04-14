import multer from "multer";
import { BadRequestError } from "../../error/index.js";

const allowedExtensions = [".json"];
const allowedMimetypes = ["application/json"];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {

  if (!allowedMimetypes.includes(file.mimetype)) {
    cb(new BadRequestError("Only JSON files are allowed"));
    return;
  }

  const lastDotIndex = file.originalname.lastIndexOf(".");

  if (lastDotIndex < 0) {
    cb(new BadRequestError("Only JSON files are allowed"));
    return;
  }

  const fileExtension = file.originalname
    .substring(lastDotIndex)
    .toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    cb(new BadRequestError("Only JSON files are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadJSON = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});