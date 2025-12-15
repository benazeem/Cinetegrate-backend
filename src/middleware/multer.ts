import { Request } from "express";
import multer from "multer";
import { BadRequestError } from "./error/index.js"; 

const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, "./temp/uploads");
  },
  filename: function (req, file, cb) { 
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix );
  },
});

const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const allowedMimetypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/") || !allowedMimetypes.includes(file.mimetype)) {
    cb(new BadRequestError("Only image files (jpg, jpeg, png, gif, webp) are allowed"));
    return;
  }
  
  const fileExtension = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    cb(new BadRequestError("Only image files (jpg, jpeg, png, gif, webp) are allowed"));
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
