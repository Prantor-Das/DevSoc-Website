import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional(),
  JWT_SECRET: z.string().nonempty("JWT_SECRET is required"),
  DATABASE_URL: z.string().nonempty("DATABASE_URL is required"),
  CLIENT_URL: z
    .string()
    .url("CLIENT_URL must be a valid URL")
    .nonempty("CLIENT_URL is required"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const validationResult = envSchema.safeParse(env);
  if (!validationResult.success)
    throw new Error(validationResult.error.message);
  return validationResult.data;
}

export const env = createEnv(process.env);
