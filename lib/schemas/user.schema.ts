import { z } from "zod";

export const USER_ROLES = ["MANAGER", "USER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const setUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(USER_ROLES),
});

export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
