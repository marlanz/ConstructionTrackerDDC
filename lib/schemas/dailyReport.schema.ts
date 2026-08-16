import { z } from "zod";

export const reportPersonelSchema = z.object({
  party: z.string().min(1, "Personnel party is required"),
  role: z.string().min(1, "Personnel role is required"),
  amount: z.number().int().min(0, "Amount must be a non-negative number"),
  note: z.string().nullable().optional().default(null),
});

export const workAgendaEntrySchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Work agenda title is required").trim(),
  description: z.string().nullable().optional().default(null),
  taskId: z.string().nullable().optional().default(null),
  imgUrl: z.array(z.string()).default([]),
});

export const createDailyReportSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  date: z.coerce.date(),
  workStartTime: z.string().min(1, "Work start time is required").default("07:00"),
  workEndTime: z.string().min(1, "Work end time is required").default("18:00"),
  installationMachine: z.array(z.string()).default([]),
  installationPersonel: z.array(reportPersonelSchema).default([]),
  workAgenda: z.array(workAgendaEntrySchema).default([]),
});

export const updateDailyReportSchema = createDailyReportSchema
  .partial()
  .omit({ projectId: true });

export const addWorkAgendaEntrySchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  entry: workAgendaEntrySchema,
});

export type CreateDailyReportInput = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReportInput = z.infer<typeof updateDailyReportSchema>;
export type AddWorkAgendaEntryInput = z.infer<typeof addWorkAgendaEntrySchema>;
export type WorkAgendaEntryInput = z.infer<typeof workAgendaEntrySchema>;
