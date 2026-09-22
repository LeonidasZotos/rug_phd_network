import { z } from "zod";

const locationSchema = z.object({
  city: z.string().min(1).max(90),
  country: z.string().min(1).max(80),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationKey: z.string().min(1).max(180)
}).strict();

export const publicPersonSchema = z.object({
  id: z.string().min(8).max(64),
  name: z.string().min(1).max(120).optional(),
  location: locationSchema.optional(),
  phd: z.object({
    startMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    currentYearLabel: z.string().regex(/^Year (?:[1-4]|5\+)$/).optional()
  }).strict().optional(),
  homeCountry: z.string().min(1).max(80).optional(),
  languages: z.array(z.string().min(1).max(80)).max(20).optional(),
  institutes: z.array(z.enum(["GIA", "CLCG", "ICOG"])).max(3),
  topics: z.array(z.string().min(1).max(80)).max(20),
  hobbies: z.array(z.string().min(1).max(80)).max(20),
  links: z.object({
    linkedin: z.url().optional(),
    orcid: z.url().optional(),
    rug: z.url().optional()
  }).strict()
}).strict();

export const publicDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(["live", "demo"]),
  lastUpdated: z.iso.datetime(),
  people: z.array(publicPersonSchema)
}).strict();
