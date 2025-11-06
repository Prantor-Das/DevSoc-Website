import type { Request, Response, NextFunction } from "express";
import { UNAUTHORIZED, FORBIDDEN } from "../utils/http.js";
import { verifyAccessToken } from "../libs/jwt.js";
import { findValidSessionByRefreshToken } from "../services/session.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

export function verifyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for both access and refresh tokens
    const accessToken =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    const refreshToken = req.cookies?.refresh_token;

    // Both tokens must be present for enhanced security
    if (!accessToken || !refreshToken) {
      return res.status(UNAUTHORIZED).json(
        new ApiResponse(UNAUTHORIZED, null, "Unauthorized user")
      );
    }

    // Verify access token
    const payload = verifyAccessToken(accessToken);

    // Store auth info
    if (payload.sid !== undefined) {
      req.auth = {
        userId: payload.sub,
        role: payload.role,
        sessionId: payload.sid,
      };
    } else {
      req.auth = { userId: payload.sub, role: payload.role };
    }

    next();
  } catch (error) {
    return res.status(UNAUTHORIZED).json(
      new ApiResponse(UNAUTHORIZED, null, "Unauthorized user")
    );
  }
}

// Verify admin
export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(UNAUTHORIZED).json(
      new ApiResponse(UNAUTHORIZED, null, "Unauthorized user")
    );
  }
  if (req.auth.role !== "ADMIN") {
    return res.status(FORBIDDEN).json(
      new ApiResponse(FORBIDDEN, null, "Admin privileges required")
    );
  }
  next();
}

// Verify subcommittee members
export function verifySubcomAndAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.auth) {
    return res.status(UNAUTHORIZED).json(
      new ApiResponse(UNAUTHORIZED, null, "Unauthorized user")
    );
  }
  if (req.auth.role === "USER" ) {
    return res.status(FORBIDDEN).json(
      new ApiResponse(FORBIDDEN, null, "Subcommittee privileges required")
    );
  }
  next();
}

// Session validation middleware - validates that the session is still active
export function validateSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth?.sessionId) {
        return next(); // Skip if no session ID
      }

      const refreshToken = req.cookies?.refresh_token;
      const accessToken = req.cookies?.access_token;
      
      if (!refreshToken || !accessToken) {
        return res.status(UNAUTHORIZED).json(
          new ApiResponse(UNAUTHORIZED, null, "Unauthorized user")
        );
      }

      const session = await findValidSessionByRefreshToken(refreshToken);
      if (!session || session.id !== req.auth.sessionId) {
        return res.status(UNAUTHORIZED).json(
          new ApiResponse(UNAUTHORIZED, null, "Session expired")
        );
      }

      next();
    }
  )(req, res, next);
}

// Optional auth middleware - doesn't fail if no token, but validates if present
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload.sid !== undefined) {
        req.auth = {
          userId: payload.sub,
          role: payload.role,
          sessionId: payload.sid,
        };
      } else {
        req.auth = { userId: payload.sub, role: payload.role };
      }
    }

    next();
  } catch {
    // If token is invalid, continue without auth (don't fail)
    next();
  }
}
