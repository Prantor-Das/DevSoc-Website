import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { envKeys } from "../utils/envKeys.js";

const convexUrl = envKeys.CONVEX_URL;
if (!convexUrl) {
  throw new Error("CONVEX_URL environment variable is required");
}

const CONVEX_URL: string = convexUrl;

export const convex = new ConvexHttpClient(CONVEX_URL);

// Helper function to sync user data to Convex
export async function syncUserToConvex(user: {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: "USER" | "ADMIN" | "SUBCOMMITTEE";
  createdAt: Date;
  updatedAt: Date;
}) {
  const adminKey = envKeys.CONVEX_ADMIN_KEY;
  try {
    // Use the Convex client to call the mutation
    const result = await convex.mutation(api.userActions.upsert, {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    return result;
  } catch (error) {
    console.error("Failed to sync user to Convex:", error);
    throw error;
  }
}

// Helper function to get user from Convex
export async function getUserFromConvex(externalId: string) {
  try {
    return await convex.query(api.userQueries.getUserByExternalId, {
      externalId,
    });
  } catch (error) {
    console.error("Failed to get user from Convex:", error);
    throw error;
  }
}
