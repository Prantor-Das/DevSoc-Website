import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { INTERNAL_SERVER_ERROR } from "../utils/http.js";
import { envKeys } from "../utils/envKeys.js";

/**
 * Global error handler middleware
 * Catches all errors and sends a standardized response
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // If it's not an ApiError, convert it to one
  if (!(error instanceof ApiError)) {
    const statusCode = INTERNAL_SERVER_ERROR;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, [], error.stack);
  }

  const apiError = error as ApiError;

  // Log error for debugging (in development)
  if (envKeys.NODE_ENV === "development") {
    console.error("Error:", {
      message: apiError.message,
      statusCode: apiError.statusCode,
      stack: apiError.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Send error response
  return res
    .status(apiError.statusCode)
    .json(new ApiResponse(apiError.statusCode, null, apiError.message));
};
