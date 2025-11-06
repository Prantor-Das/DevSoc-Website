import { prisma } from "../libs/db.js";

export interface RegistrationData {
  userId: string;
  eventId: string;
  formData: Record<string, any>;
}

export async function registerForEvent(userId: string, eventId: string, formData: Record<string, any>) {
  // Check if user is already registered
  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: {
      userId_eventId: { userId, eventId }
    }
  });

  if (existingRegistration) {
    throw new Error("User already registered for this event");
  }

  // Check if event exists and is active
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { isActive: true, startDate: true, endDate: true }
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (!event.isActive) {
    throw new Error("Event is not active");
  }

  const now = new Date();
  if (event.startDate <= now) {
    throw new Error("Registration closed - event has already started");
  }

  return prisma.eventRegistration.create({
    data: { userId, eventId, formData },
    include: {
      event: {
        select: { id: true, title: true, startDate: true, endDate: true }
      },
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function listRegistrationsForEvent(eventId: string) {
  // Check if event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new Error("Event not found");
  }

  return prisma.eventRegistration.findMany({
    where: { eventId },
    include: { 
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function listUserRegistrations(userId: string) {
  return prisma.eventRegistration.findMany({
    where: { userId },
    include: { 
      event: {
        select: { 
          id: true, 
          title: true, 
          description: true, 
          startDate: true, 
          endDate: true, 
          location: true,
          isActive: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getRegistration(userId: string, eventId: string) {
  return prisma.eventRegistration.findUnique({
    where: {
      userId_eventId: { userId, eventId }
    },
    include: {
      event: {
        select: { id: true, title: true, startDate: true, endDate: true }
      }
    }
  });
}

export async function cancelRegistration(userId: string, eventId: string) {
  const registration = await prisma.eventRegistration.findUnique({
    where: {
      userId_eventId: { userId, eventId }
    },
    include: {
      event: {
        select: { startDate: true, isActive: true }
      }
    }
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  const now = new Date();
  if (registration.event.startDate <= now) {
    throw new Error("Cannot cancel registration - event has already started");
  }

  return prisma.eventRegistration.delete({
    where: {
      userId_eventId: { userId, eventId }
    }
  });
}

export async function getRegistrationCount(eventId: string) {
  return prisma.eventRegistration.count({
    where: { eventId }
  });
}