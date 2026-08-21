import { ProjectStatus } from "@/lib/schemas/project.schema";

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNED: "Lên kế hoạch",
  IN_PROGRESS: "Đang triển khai",
  COMPLETED: "Hoàn thành",
  ON_HOLD: "Tạm dừng",
  CANCELLED: "Đã hủy",
  LATE: "Trễ tiến độ",
};

export const roleLabels: Record<
  "MANAGER" | "SUPERVISOR" | "USER" | "CLIENT",
  string
> = {
  MANAGER: "Quản lý dự án",
  SUPERVISOR: "Giám sát viên",
  USER: "Người dùng",
  CLIENT: "Khách hàng",
};

export const personnelPartyLabels: Record<string, string> = {
  CONTRACTOR: "Nhà thầu",
  SUB_CONTRACTOR: "Nhà thầu phụ",
  OWNER: "Chủ đầu tư",
  SUPERVISOR: "Giám sát",
};
