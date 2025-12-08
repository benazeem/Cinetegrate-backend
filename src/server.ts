import dotenv from "dotenv";
import type { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import getCorsConfig from "@utils/corsConfig.js";
import connectDB from "@db/connect.js";
import loggerMiddleware from "@middleware/logger/loggerMiddleware.js";
import notFoundHandler from "@middleware/404/notFoundHandler.js";
import globalErrorHandler from "@middleware/error/globalErrorHandler.js";
import apiRouter from "@routes/index.js";

dotenv.config();

const app: Application = express();

app.use(helmet());
const corsOptions = getCorsConfig();
app.use(cors(corsOptions));

// JSON parser
app.use(
  express.json({
    limit: "1mb",
  })
);

// Basic logger
app.use(loggerMiddleware);

// Health route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", apiRouter);

// 404 handler
// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     error: {
//       code: "NOT_FOUND",
//       message: `Route ${req.method} ${req.path} not found`,
//     },
//   });
// });
app.use(notFoundHandler);

// Error handler
// app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
//   console.error("Internal Server Error:", err);
//   res.status(500).json({
//     error: {
//       code: "INTERNAL_SERVER_ERROR",
//       message: "Something went wrong.",
//     },
//   });
// });
app.use(globalErrorHandler);

const startServer = async () => {
  try {
    // Wait for DB first
    await connectDB();

    // Start server only if DB connected
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
      console.log(`at http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to start server:", message);
    process.exit(1); // stop app
  }
};

startServer();
