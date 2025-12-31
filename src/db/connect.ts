import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
const username = encodeURIComponent(process.env.DB_USERNAME ?? "");

const CONNECTION_STRING = `${
  process.env.NODE_ENV !== "production"
    ? "mongodb://localhost:27017/your_db_name?replicaSet=rs0"
    : `mongodb+srv://${username}:${password}@db0.huxhv46.mongodb.net/?appName=DB0`
}`;
const connectDB = async () => {
  try {
    await mongoose.connect(`${CONNECTION_STRING}`, {
      dbName: "myapp",
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error(
      "❌ MongoDB Error:",
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
};

export default connectDB;
