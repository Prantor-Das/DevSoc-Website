import { Router } from "express";

const newsletterRouter = Router();

import {
  createNewsletter,
  getNewsletters,
  getNewsletterById,
  updateNewsletter,
  deleteNewsletter,
} from "../controller/newsletter.controller.js";

import {
  verifyAuth,
  verifyAdmin,
  optionalAuth,
  validateSession,
} from "../middleware/auth.middleware.js";

// Create newsletter - only ADMIN and SUBCOMMITTEE can create
newsletterRouter.post("/", verifyAuth, validateSession, (req, res, next) => {
  if (req.auth?.role === "ADMIN" || req.auth?.role === "SUBCOMMITTEE") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Required roles: ADMIN, SUBCOMMITTEE" });
  }
}, createNewsletter);

// Get newsletters - public but can show different data based on auth
newsletterRouter.get("/", optionalAuth, getNewsletters);

// Get single newsletter - public but can show different data based on auth
newsletterRouter.get("/:id", optionalAuth, getNewsletterById);

// Update newsletter - only ADMIN and SUBCOMMITTEE can update
newsletterRouter.patch("/:id", verifyAuth, validateSession, (req, res, next) => {
  if (req.auth?.role === "ADMIN" || req.auth?.role === "SUBCOMMITTEE") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Required roles: ADMIN, SUBCOMMITTEE" });
  }
}, updateNewsletter);

// Delete newsletter - only ADMIN can delete
newsletterRouter.delete("/:id", verifyAuth, verifyAdmin, validateSession, deleteNewsletter);

export default newsletterRouter;
