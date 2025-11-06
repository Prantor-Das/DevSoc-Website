import { PrismaClient } from "@prisma/client";
import { envKeys } from "../utils/envKeys.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: 
      envKeys.NODE_ENV === "development" && !envKeys.DISABLE_LOGGING
        ? ["error", "warn"] 
        : [], // No logging in production or when disabled
  });

if (envKeys.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const db = prisma;
