import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { prisma } from "./libs/db.js";
import { envKeys } from "./utils/envKeys.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import authRouter from "./routes/auth.routes.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: envKeys.CLIENT_URL,
    credentials: true,
  })
);

const PORT: number = envKeys.PORT;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.use("/api/v1/auth", authRouter);

app.use(errorHandler);

// Connect to Database
async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
}

start();
