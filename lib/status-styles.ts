import { ProjectStatus } from "@/lib/schemas/project.schema";
import { projectStatusLabels } from "@/lib/i18n/labels";

export interface StatusStyle {
  label: string;
  badgeClass: string;
}

export const PROJECT_STATUS_MAP: Record<ProjectStatus, StatusStyle> = {
  PLANNED: {
    label: projectStatusLabels.PLANNED,
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  },
  IN_PROGRESS: {
    label: projectStatusLabels.IN_PROGRESS,
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  },
  COMPLETED: {
    label: projectStatusLabels.COMPLETED,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  ON_HOLD: {
    label: projectStatusLabels.ON_HOLD,
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  },
  CANCELLED: {
    label: projectStatusLabels.CANCELLED,
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
  },
};

export function getProjectStatusStyle(status: string): StatusStyle {
  return (
    PROJECT_STATUS_MAP[status as ProjectStatus] || {
      label: status,
      badgeClass: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
    }
  );
}
