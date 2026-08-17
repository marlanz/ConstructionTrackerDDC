export const UserRole = {
  MANAGER: "MANAGER",
  SUPERVISOR: "SUPERVISOR",
  CLIENT: "CLIENT", //not yet implemented
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_VN_LABELS: Record<UserRoleType, string> = {
  [UserRole.MANAGER]: "Quản lý dự án",
  [UserRole.SUPERVISOR]: "Giám sát viên",
  [UserRole.CLIENT]: "Khách hàng",
};
