import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { CREATED, OK, BAD_REQUEST, FORBIDDEN, NOT_FOUND } from "../utils/http.js";
import * as EventService from "../services/event.service.js";
import * as FormService from "../services/form.service.js";
import { EventSchema } from "../validator/event.validator.js";


export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(BAD_REQUEST, parsed.error.issues.map((e: any) => e.message).join(", "));
  }

  const { startDate, endDate } = parsed.data;
  const now = new Date();
  
  if (startDate <= now) {
    throw new ApiError(BAD_REQUEST, "Start date must be in the future");
  }
  
  if (startDate >= endDate) {
    throw new ApiError(BAD_REQUEST, "Start date must be before end date");
  }

  try {
    const eventData: EventService.CreateEventData = {
      title: parsed.data.title,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      createdById: req.auth!.userId,
    };
    
    if (parsed.data.location !== undefined) {
      eventData.location = parsed.data.location;
    }
    if (parsed.data.bannerImage !== undefined) {
      eventData.bannerImage = parsed.data.bannerImage;
    }
    
    const event = await EventService.createEvent(eventData);
    return res.status(CREATED).json(new ApiResponse(CREATED, event, "Event created successfully"));
  } catch (error: any) {
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  const event = await EventService.getEventById(eventId);
  if (!event) throw new ApiError(NOT_FOUND, "Event not found");

  // Check permissions
  const isCreator = event.createdById === req.auth!.userId;
  const isAdmin = req.auth!.role === "ADMIN";
  const isSubcommittee = req.auth!.role === "SUBCOMMITTEE";
  
  if (!isAdmin && !isSubcommittee && !isCreator) {
    throw new ApiError(FORBIDDEN, "You don't have permission to update this event");
  }

  const parsed = EventSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(BAD_REQUEST, parsed.error.issues.map((e: any) => e.message).join(", "));
  }

  // Build update data, only including defined values
  const updateData: EventService.UpdateEventData = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate;
  if (parsed.data.endDate !== undefined) updateData.endDate = parsed.data.endDate;
  if (parsed.data.bannerImage !== undefined) updateData.bannerImage = parsed.data.bannerImage;

  try {
    const updated = await EventService.updateEvent(eventId, updateData);
    return res.status(OK).json(new ApiResponse(OK, updated, "Event updated successfully"));
  } catch (error: any) {
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  if (req.auth!.role !== "ADMIN") {
    throw new ApiError(FORBIDDEN, "Only administrators can delete events");
  }

  try {
    await EventService.deleteEvent(eventId);
    return res.status(OK).json(new ApiResponse(OK, null, "Event deleted successfully"));
  } catch (error: any) {
    if (error.message === "Event not found") {
      throw new ApiError(NOT_FOUND, "Event not found");
    }
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const { active, upcoming, q } = req.query;
  
  const filters: EventService.EventFilters = {};
  
  if (active === "true") filters.active = true;
  else if (active === "false") filters.active = false;
  
  if (upcoming === "true") filters.upcoming = true;
  
  if (q && typeof q === "string" && q.trim()) {
    filters.q = q.trim();
  }
  
  const events = await EventService.listEvents(filters);
  return res.status(OK).json(new ApiResponse(OK, events, "Events fetched successfully"));
});

export const getEventDetails = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  const event = await EventService.getEventById(eventId);
  if (!event) throw new ApiError(NOT_FOUND, "Event not found");
  
  return res.status(OK).json(new ApiResponse(OK, event, "Event details fetched successfully"));
});

export const upsertForm = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  const event = await EventService.getEventById(eventId);
  if (!event) throw new ApiError(NOT_FOUND, "Event not found");

  // Check permissions
  const isCreator = event.createdById === req.auth!.userId;
  const isAdmin = req.auth!.role === "ADMIN";
  const isSubcommittee = req.auth!.role === "SUBCOMMITTEE";
  
  if (!isAdmin && !isSubcommittee && !isCreator) {
    throw new ApiError(FORBIDDEN, "You don't have permission to modify this event's form");
  }

  const { fields } = req.body;
  if (!Array.isArray(fields)) {
    throw new ApiError(BAD_REQUEST, "Fields must be an array");
  }

  if (fields.length === 0) {
    throw new ApiError(BAD_REQUEST, "At least one form field is required");
  }

  // Validate form fields structure
  for (const field of fields) {
    if (!field.name || !field.type || !field.label) {
      throw new ApiError(BAD_REQUEST, "Each field must have name, type, and label");
    }
  }

  try {
    const form = await FormService.upsertEventForm(eventId, fields);
    return res.status(OK).json(new ApiResponse(OK, form, "Event form updated successfully"));
  } catch (error: any) {
    throw new ApiError(BAD_REQUEST, error.message);
  }
});

export const getForm = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) throw new ApiError(BAD_REQUEST, "Event ID is required");

  const form = await FormService.getEventForm(eventId);
  if (!form) throw new ApiError(NOT_FOUND, "No registration form found for this event");
  
  return res.status(OK).json(new ApiResponse(OK, form, "Event form fetched successfully"));
});
