import { prisma } from "../libs/db.js";

export async function upsertEventForm(eventId: string, fields: any) {
    return prisma.eventForm.upsert({
        where: { eventId },
        update: { fields, eventId, updatedAt: new Date() }, 
        create: { eventId, fields },
    });
}

export async function getEventForm(eventId: string) {
    return prisma.eventForm.findUnique({ where: { eventId } });
}
