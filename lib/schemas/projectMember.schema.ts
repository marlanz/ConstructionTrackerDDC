import { z } from "zod";

export const addProjectMemberSchema = z.object({
  projectId: z.string().min(1, "Thiếu ID dự án"),
  userId: z.string().min(1, "Thiếu ID người dùng"),
});

export const removeProjectMemberSchema = z.object({
  memberId: z.string().min(1, "Thiếu ID thành viên"),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type RemoveProjectMemberInput = z.infer<typeof removeProjectMemberSchema>;
