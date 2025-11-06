import { asyncHandler } from "../utils/asyncHandler.js";
import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const createNewsletter = asyncHandler(
  async (req: Request, res: Response) => {
    // Implementation for creating a newsletter
  }
);

// admin send how many newsletter they want and we send that many response
export const getNewsletters = asyncHandler(
  async (req: Request, res: Response) => {
    // Implementation for retrieving newsletters
  }
);

// params e id pathabe
export const getNewsletterById = asyncHandler(
  async (req: Request, res: Response) => {
    // Implementation for retrieving a newsletter by ID
  }
);

export const updateNewsletter = asyncHandler(
  async (req: Request, res: Response) => {
    // Implementation for updating a newsletter
  }
);

export const deleteNewsletter = asyncHandler(
  async (req: Request, res: Response) => {
    // Implementation for deleting a newsletter
  }
);
