import { Request } from "express";
import multer from "multer";
import { BadRequestError } from "./error/index.js";
import path from "path";

const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, "./temp/uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("file", file, "uniqueSuffix", uniqueSuffix);
    console.log("req", req.user);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new BadRequestError("Only image files are allowed"));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 },
});

export { upload };
