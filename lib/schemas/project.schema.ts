import { z } from "zod";

export const PROJECT_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
  "LATE",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const factorySchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên nhà máy"),
  location: z.string().min(1, "Vui lòng nhập địa chỉ nhà máy"),
});

export const createProjectSchema = z.object({
  projectCode: z.string().min(1, "Vui lòng nhập mã dự án").trim(),
  name: z.string().min(1, "Vui lòng nhập tên dự án").trim(),
  description: z.string().default(""),
  factory: factorySchema,
  briefPlan: z.string().nullable().optional().default(null),
  startDate: z.coerce.date(),
  plannedEndDate: z.coerce.date(),
  status: z.enum(PROJECT_STATUSES).default("PLANNED"),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  actualEndDate: z.coerce.date().nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
