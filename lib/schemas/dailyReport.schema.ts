import { z } from "zod";

export const reportPersonelSchema = z.object({
  party: z.string().min(1, "Vui lòng nhập đơn vị nhân sự"),
  role: z.string().min(1, "Vui lòng nhập chức danh nhân sự"),
  amount: z.number().int().min(0, "Số lượng phải là số nguyên không âm"),
  note: z.string().nullable().optional().default(null),
});

export const workAgendaImageSchema = z.union([
  z.object({
    url: z.string().min(1, "URL hình ảnh không được trống"),
    publicId: z.string().default(""),
  }),
  z.string().transform((url) => ({ url, publicId: "" })),
]);

export const workAgendaEntrySchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Vui lòng nhập tiêu đề hạng mục công việc").trim(),
  description: z.string().nullable().optional().default(null),
  taskId: z.string().nullable().optional().default(null),
  imgUrl: z.array(workAgendaImageSchema).default([]),
});

export const createDailyReportSchema = z.object({
  projectId: z.string().min(1, "Thiếu ID dự án"),
  date: z.coerce.date(),
  workStartTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu làm việc").default("07:00"),
  workEndTime: z.string().min(1, "Vui lòng chọn giờ kết thúc làm việc").default("18:00"),
  installationMachine: z.array(z.string()).default([]),
  installationPersonel: z.array(reportPersonelSchema).default([]),
  workAgenda: z.array(workAgendaEntrySchema).default([]),
});

export const updateDailyReportSchema = createDailyReportSchema
  .partial()
  .omit({ projectId: true });

export const addWorkAgendaEntrySchema = z.object({
  reportId: z.string().min(1, "Thiếu ID báo cáo"),
  entry: workAgendaEntrySchema,
});

export type CreateDailyReportInput = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReportInput = z.infer<typeof updateDailyReportSchema>;
export type AddWorkAgendaEntryInput = z.infer<typeof addWorkAgendaEntrySchema>;
export type WorkAgendaEntryInput = z.infer<typeof workAgendaEntrySchema>;
