import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Utility to wrap async route handlers and forward errors to Express
 * @param requestHandler - Async Express route handler
 * @returns A wrapped route handler that catches async errors
 */
const asyncHandler = (
  requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export { asyncHandler };
