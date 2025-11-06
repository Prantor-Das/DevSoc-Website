import { Router } from "express";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,
  getEventDetails,
  upsertForm,
  getForm,
} from "../controller/event.controller.js";
import {
  registerForEvent,
  listMyRegistrations,
  listEventRegistrations,
  cancelRegistration,
  getMyRegistration,
} from "../controller/registration.controller.js";
import {
  verifyAuth,
  verifyAdmin,
  validateSession,
  verifySubcomAndAdmin,
} from "../middleware/auth.middleware.js";

const eventRouter = Router();

// Event routes
eventRouter.post("/", verifyAuth, verifySubcomAndAdmin, validateSession, createEvent);
eventRouter.patch("/:id", verifyAuth, verifySubcomAndAdmin, validateSession, updateEvent);
eventRouter.delete("/:id", verifyAuth, verifyAdmin, validateSession, deleteEvent);
eventRouter.get("/", listEvents);
eventRouter.get("/:id", verifyAuth, getEventDetails);

// Form routes
eventRouter.put("/:id/form", verifyAuth, validateSession, upsertForm);
eventRouter.get("/:id/form", verifyAuth, getForm);

// Registration routes
eventRouter.post("/:id/register", verifyAuth, validateSession, registerForEvent);
eventRouter.get("/me/registrations", verifyAuth, validateSession, listMyRegistrations);
eventRouter.get("/:id/registrations", verifyAuth, validateSession, listEventRegistrations);
eventRouter.delete("/:id/register", verifyAuth, validateSession, cancelRegistration);
eventRouter.get("/:id/register", verifyAuth, validateSession, getMyRegistration);

export default eventRouter;