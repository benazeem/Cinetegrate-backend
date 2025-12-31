import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import getCorsConfig from "config/corsConfig.js";
import { requestLogger } from "@middleware/loggerMiddleware.js";
import notFoundHandler from "@middleware/404/notFoundHandler.js";
import errorHandler from "@middleware/error/globalErrorHandler.js";

import apiRouter from "@routes/api.js";

const AppRouter = Router();

AppRouter.use(helmet());
const corsOptions = getCorsConfig();
AppRouter.use(cors(corsOptions));

AppRouter.use(cookieParser());

// Basic logger
AppRouter.use(requestLogger);

// Health route
AppRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

AppRouter.use("/api", apiRouter);

AppRouter.use(notFoundHandler);

AppRouter.use(errorHandler);

export default AppRouter;
