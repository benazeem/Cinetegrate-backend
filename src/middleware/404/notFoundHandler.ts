import type { Request, Response, NextFunction } from "express";

interface ErrorResponse {
  error: string;
  message: string;
}

const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404);

  if (req.accepts("json")) {
    res.json({
      error: "Not Found",
      message: `The resource at ${req.originalUrl} was not found on this server.`,
    } as ErrorResponse);
    return;
  }

  res.type("txt").send("404 Not Found");
};

export default  notFoundHandler;
