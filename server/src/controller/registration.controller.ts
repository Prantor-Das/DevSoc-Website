import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { BAD_REQUEST, OK, CONFLICT, FORBIDDEN, NOT_FOUND } from "../utils/http.js";
import * as EventService from "../services/event.service.js";
import * as FormService from "../services/form.service.js";
import * as RegService from "../services/registration.service.js";
import { buildZodSchema } from "../utils/buildForm.js";

export const registerForEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  const event = await EventService.getEventById(eventId);
  if (!event) throw new ApiError(NOT_FOUND, "Event not found");
  
  if (!event.isActive) throw new ApiError(FORBIDDEN, "Event registration is not active");

  const form = await FormService.getEventForm(eventId);
  if (!form) throw new ApiError(BAD_REQUEST, "Event has no registration form");

  // Validate form data
  const schema = buildZodSchema(form.fields as any[]);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(BAD_REQUEST, parsed.error.issues.map((e: any) => e.message).join(", "));
  }

  try {
    const registration = await RegService.registerForEvent(req.auth!.userId, eventId, parsed.data);
    return res.status(OK).json(new ApiResponse(OK, registration, "Successfully registered for event"));
  } catch (error: any) {
    if (error.message === "User already registered for this event") {
      throw new ApiError(CONFLICT, "You are already registered for this event");
    }
    if (error.message === "Event is not active") {
      throw new ApiError(FORBIDDEN, "Event registration is not active");
    }
    if (error.message === "Registration closed - event has already started") {
      throw new ApiError(FORBIDDEN, "Registration is closed - event has already started");
    }
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const listMyRegistrations = asyncHandler(async (req: Request, res: Response) => {
  const registrations = await RegService.listUserRegistrations(req.auth!.userId);
  return res.status(OK).json(new ApiResponse(OK, registrations, "Your registrations fetched successfully"));
});

export const listEventRegistrations = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  if (!["ADMIN", "SUBCOMMITTEE"].includes(req.auth!.role)) {
    throw new ApiError(FORBIDDEN, "Access denied. Admin or Subcommittee privileges required");
  }

  try {
    const registrations = await RegService.listRegistrationsForEvent(eventId);
    return res.status(OK).json(new ApiResponse(OK, registrations, "Event registrations fetched successfully"));
  } catch (error: any) {
    if (error.message === "Event not found") {
      throw new ApiError(NOT_FOUND, "Event not found");
    }
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const cancelRegistration = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  try {
    await RegService.cancelRegistration(req.auth!.userId, eventId);
    return res.status(OK).json(new ApiResponse(OK, null, "Registration cancelled successfully"));
  } catch (error: any) {
    if (error.message === "Registration not found") {
      throw new ApiError(NOT_FOUND, "Registration not found");
    }
    if (error.message === "Cannot cancel registration - event has already started") {
      throw new ApiError(FORBIDDEN, "Cannot cancel registration - event has already started");
    }
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const getMyRegistration = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  const registration = await RegService.getRegistration(req.auth!.userId, eventId);
  if (!registration) throw new ApiError(NOT_FOUND, "Registration not found");

  return res.status(OK).json(new ApiResponse(OK, registration, "Registration details fetched successfully"));
});
