import { z } from "zod";

export const installationToolSchema = z.object({
  party: z.string().min(1, "Tool party/owner is required"),
  name: z.string().min(1, "Tool name is required"),
});

export const installationPersonelSchema = z.object({
  party: z.string().min(1, "Personnel party is required"),
  role: z.string().min(1, "Personnel role is required"),
  amount: z.number().int().min(0, "Amount must be a non-negative number"),
  note: z.string().nullable().optional().default(null),
});

export const createInstallationTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  sequence: z.number().int().optional(),
  sectionCode: z.string().nullable().optional().default(null),
  agenda: z.string().min(1, "Agenda description is required").trim(),
  qty: z.number().nullable().optional().default(null),
  unit: z.string().nullable().optional().default(null),
  dimension: z.string().nullable().optional().default(null),
  installationLocation: z.string().nullable().optional().default(null),
  installationEquipments: z.array(z.string()).default([]),
  installationTools: z.array(installationToolSchema).default([]),
  installationPersonel: z.array(installationPersonelSchema).default([]),
  plannedStartDate: z.coerce.date(),
  plannedEndDate: z.coerce.date(),
  installationPeriod: z.string().nullable().optional().default(null),
  note: z.string().nullable().optional().default(null),
  progression: z.number().min(0).max(100).default(0),
});

export const updateInstallationTaskSchema = createInstallationTaskSchema
  .partial()
  .omit({ projectId: true });

export const updateTaskProgressSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  progression: z.number().min(0, "Progression must be between 0 and 100").max(100, "Progression must be between 0 and 100"),
});

export const reorderInstallationTasksSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  orderedTaskIds: z.array(z.string().min(1, "Task ID cannot be empty")).min(1, "At least one task ID is required"),
});

export type CreateInstallationTaskInput = z.infer<typeof createInstallationTaskSchema>;
export type UpdateInstallationTaskInput = z.infer<typeof updateInstallationTaskSchema>;
export type UpdateTaskProgressInput = z.infer<typeof updateTaskProgressSchema>;
export type ReorderInstallationTasksInput = z.infer<typeof reorderInstallationTasksSchema>;
