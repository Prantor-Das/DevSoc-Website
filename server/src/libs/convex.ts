import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { envKeys } from "../utils/envKeys.js";

const convexUrl = envKeys.CONVEX_DEPLOYMENT;
if (!convexUrl) {
  throw new Error("CONVEX_DEPLOYMENT environment variable is required");
}

const CONVEX_DEPLOYMENT: string = convexUrl;

export const convex = new ConvexHttpClient(CONVEX_DEPLOYMENT);

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
    if (envKeys.NODE_ENV === "development" && !envKeys.DISABLE_LOGGING) {
      console.error("Failed to sync user to Convex:", error);
    }
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
    if (envKeys.NODE_ENV === "development" && !envKeys.DISABLE_LOGGING) {
      console.error("Failed to get user from Convex:", error);
    }
    throw error;
  }
}

// Helper function to delete user from Convex
export async function deleteUserFromConvex(externalId: string) {
  try {
    const result = await convex.mutation(api.userActions.deleteUser, {
      externalId,
    });

    return result;
  } catch (error) {
    if (envKeys.NODE_ENV === "development" && !envKeys.DISABLE_LOGGING) {
      console.error("Failed to delete user from Convex:", error);
    }
    throw error;
  }
}
