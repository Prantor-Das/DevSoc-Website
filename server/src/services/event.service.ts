import { prisma } from "../libs/db.js";

export interface CreateEventData {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  bannerImage?: string;
  createdById: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  bannerImage?: string;
  isActive?: boolean;
}

export interface EventFilters {
  active?: boolean;
  upcoming?: boolean;
  q?: string;
}

export async function createEvent(data: CreateEventData) {
  // Validate dates
  if (data.startDate >= data.endDate) {
    throw new Error("Start date must be before end date");
  }

  return prisma.event.create({ 
    data,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function updateEvent(eventId: string, data: UpdateEventData) {
  // Validate dates if both are provided
  if (data.startDate && data.endDate && data.startDate >= data.endDate) {
    throw new Error("Start date must be before end date");
  }

  return prisma.event.update({ 
    where: { id: eventId }, 
    data,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function deleteEvent(eventId: string) {
  // Check if event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new Error("Event not found");
  }

  return prisma.event.delete({ where: { id: eventId } });
}

export async function getEventById(eventId: string) {
  return prisma.event.findUnique({ 
    where: { id: eventId }, 
    include: { 
      dynamicForm: true,
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { registrations: true }
      }
    } 
  });
}

export async function listEvents(filters: EventFilters = {}) {
  const { active, upcoming, q } = filters;
  const now = new Date();
  
  return prisma.event.findMany({
    where: {
      ...(active !== undefined ? { isActive: active } : {}),
      ...(upcoming ? { startDate: { gt: now } } : {}),
      ...(q ? { 
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } }
        ]
      } : {}),
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { registrations: true }
      }
    },
    orderBy: { startDate: "asc" },
  });
}

export async function checkEventExists(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  return !!event;
}

export async function isEventActive(eventId: string) {
  const event = await prisma.event.findUnique({ 
    where: { id: eventId },
    select: { isActive: true }
  });
  return event?.isActive || false;
}
