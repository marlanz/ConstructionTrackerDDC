import { z } from "zod";

export const addProjectMemberSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const removeProjectMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type RemoveProjectMemberInput = z.infer<typeof removeProjectMemberSchema>;
