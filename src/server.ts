import dotenv from "dotenv";
import express, { type Application } from "express";
import connectDB from "@db/connect.js";
import AppRouter from "@routes/index.js";
dotenv.config();

const app: Application = express();
// JSON parser
app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(AppRouter);

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
