import { z } from "zod";

export const installationToolSchema = z.object({
  party: z.string().min(1, "Vui lòng nhập đơn vị sở hữu dụng cụ"),
  name: z.string().min(1, "Vui lòng nhập tên dụng cụ"),
});

export const installationPersonelSchema = z.object({
  party: z.string().min(1, "Vui lòng nhập đơn vị nhân sự"),
  role: z.string().min(1, "Vui lòng nhập chức danh nhân sự"),
  amount: z.number().int().min(0, "Số lượng phải là số nguyên không âm"),
  note: z.string().nullable().optional().default(null),
});

export const createInstallationTaskSchema = z.object({
  projectId: z.string().min(1, "Thiếu ID dự án"),
  sequence: z.number().int().optional(),
  sectionCode: z.string().nullable().optional().default(null),
  agenda: z.string().min(1, "Vui lòng nhập mô tả công việc / hạng mục").trim(),
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
  taskId: z.string().min(1, "Thiếu ID hạng mục"),
  progression: z.number().min(0, "Tiến độ phải nằm trong khoảng từ 0% đến 100%").max(100, "Tiến độ phải nằm trong khoảng từ 0% đến 100%"),
});

export const reorderInstallationTasksSchema = z.object({
  projectId: z.string().min(1, "Thiếu ID dự án"),
  orderedTaskIds: z.array(z.string().min(1, "ID hạng mục không được để trống")).min(1, "Phải có ít nhất một hạng mục"),
});

export type CreateInstallationTaskInput = z.infer<typeof createInstallationTaskSchema>;
export type UpdateInstallationTaskInput = z.infer<typeof updateInstallationTaskSchema>;
export type UpdateTaskProgressInput = z.infer<typeof updateTaskProgressSchema>;
export type ReorderInstallationTasksInput = z.infer<typeof reorderInstallationTasksSchema>;
