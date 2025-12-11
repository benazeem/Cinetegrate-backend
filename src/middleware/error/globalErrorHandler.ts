// src/middleware/errorHandler.ts
import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("ERROR:", err);

  // If it's a known error (instance of AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Unknown / unexpected error → 500
  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};

export default errorHandler;