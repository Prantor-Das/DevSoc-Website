import {z} from "zod";

export const EventSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  location: z.string().optional(),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().transform((v) => new Date(v)),
  bannerImage: z.string().url().optional(),
});