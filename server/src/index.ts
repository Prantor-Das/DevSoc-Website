import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { db } from "./libs/db.js";
import { envKeys } from "./utils/envKeys.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: envKeys.CLIENT_URL,
    credentials: true,
  }),
);

const PORT: number = envKeys.PORT;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Connect to Database
async function start() {
  try {
    await db.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 LLM Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
      console.log(`🔄 Redis: ${process.env.REDIS_URL ? 'Connected' : 'Local'}`);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
}

start();
