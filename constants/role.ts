import { roleLabels } from "@/lib/i18n/labels";

export const UserRole = {
  MANAGER: "MANAGER",
  SUPERVISOR: "SUPERVISOR",
  CLIENT: "CLIENT", //not yet implemented
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_VN_LABELS: Record<UserRoleType, string> = {
  [UserRole.MANAGER]: roleLabels.MANAGER,
  [UserRole.SUPERVISOR]: roleLabels.SUPERVISOR,
  [UserRole.CLIENT]: roleLabels.CLIENT,
};
