import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  deleteProfile,
  logout,
  refreshAccessToken,
} from "../controller/auth.controller.js";
import { 
  verifyAuth, 
  optionalAuth,
  validateSession
} from "../middleware/auth.middleware.js";

const authRouter = Router();

// Public routes (no authentication required)
authRouter.post("/register", register);
authRouter.post("/login", login);

// Token management (requires refresh token)
authRouter.post("/refresh", refreshAccessToken);

// Protected routes (requires both access and refresh tokens)
authRouter.get("/me", verifyAuth, validateSession, getProfile);
authRouter.patch("/update", verifyAuth, validateSession, updateProfile);
authRouter.delete("/delete", verifyAuth, validateSession, deleteProfile);

// Logout (enhanced security - works with or without auth, but more secure if authenticated)
authRouter.post("/logout", optionalAuth, logout);

export default authRouter;
