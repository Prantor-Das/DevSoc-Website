import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  deleteProfile,
  logout,
  refreshToken,
} from "../controller/auth.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshToken);

authRouter.get("/me", verifyAuth, getProfile);
authRouter.patch("/update", verifyAuth, updateProfile);
authRouter.delete("/me", verifyAuth, deleteProfile);
authRouter.get("/logout", logout);

export default authRouter;
