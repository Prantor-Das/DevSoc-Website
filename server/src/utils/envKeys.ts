import { env } from "./env.js";

export const envKeys = {
  PORT: +(env.PORT ?? 8000),
  JWT_SECRET: env.JWT_SECRET,
  DATABASE_URL: env.DATABASE_URL,
  CLIENT_URL: env.CLIENT_URL,
  NODE_ENV: env.NODE_ENV,
};
