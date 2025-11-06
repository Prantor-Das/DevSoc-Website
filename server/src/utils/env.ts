import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional(),
  ACCESS_SECRET: z.string().min(1, "ACCESS_SECRET is required"),
  REFRESH_SECRET: z.string().min(1, "REFRESH_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_URL: z
    .string()
    .min(1, "CLIENT_URL is required")
    .url("CLIENT_URL must be a valid URL"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  CONVEX_URL: z.string().min(1, "CONVEX_URL is required"),
  CONVEX_ADMIN_KEY: z.string().min(1, "CONVEX_ADMIN_KEY is required"),
  COOKIE_SECURE: z.string().min(1, "COOKIE_SECURE is required"),
  COOKIE_DOMAIN: z.string().optional(),
  DISABLE_LOGGING: z.string().optional().default("false"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const validationResult = envSchema.safeParse(env);
  if (!validationResult.success)
    throw new Error(validationResult.error.message);
  return validationResult.data;
}

export const env = createEnv(process.env);
