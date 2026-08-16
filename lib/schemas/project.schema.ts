import { z } from "zod";

export const PROJECT_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const factorySchema = z.object({
  name: z.string().min(1, "Factory name is required"),
  location: z.string().min(1, "Factory location is required"),
});

export const createProjectSchema = z.object({
  projectCode: z
    .string()
    .min(1, "Project code is required")
    .trim(),
  name: z.string().min(1, "Project name is required").trim(),
  description: z.string().default(""),
  factory: factorySchema,
  briefPlan: z.string().nullable().optional().default(null),
  startDate: z.coerce.date(),
  plannedEndDate: z.coerce.date(),
  status: z.enum(PROJECT_STATUSES).default("PLANNED"),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .extend({
    actualEndDate: z.coerce.date().nullable().optional(),
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
