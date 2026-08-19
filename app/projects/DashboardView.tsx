"use client";

import { useState } from "react";
import Link from "next/link";
import { SerializedProject } from "@/lib/services/project.service";
import { getProjectStatusStyle } from "@/lib/status-styles";
import { formatDate } from "@/lib/i18n/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import {
  Building2,
  Calendar,
  MapPin,
  Plus,
  ArrowRight,
  FolderKanban,
} from "lucide-react";

interface DashboardViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  projects: SerializedProject[];
}

export function DashboardView({ user, projects }: DashboardViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const isManager = user.role === "MANAGER";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bảng tổng hợp dự án lắp đặt tại DDC
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            {isManager
              ? "Giám sát tất cả các dự án xây dựng và lắp đặt thiết bị tại các nhà máy."
              : "Các dự án bạn hiện đang được giao giám sát."}
          </p>
        </div>

        {isManager && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Tạo dự án mới
          </Button>
        )}
      </div>

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 mb-4">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
            Không tìm thấy dự án
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            {isManager
              ? "Bắt đầu bằng cách tạo dự án đầu tiên của bạn."
              : "Bạn chưa được phân công vào dự án nào."}
          </p>
          {isManager && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="mt-6 gap-2"
            >
              <Plus className="h-4 w-4" /> Tạo dự án mới
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const statusStyle = getProjectStatusStyle(project.status);

            return (
              <Card
                key={project._id}
                className="flex flex-col justify-between hover:shadow-md transition-shadow dark:hover:border-zinc-700"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-semibold"
                    >
                      {project.projectCode}
                    </Badge>
                    <Badge className={statusStyle.badgeClass}>
                      {statusStyle.label}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-50">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description || "Chưa có mô tả."}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="font-medium text-sm dark:text-zinc-200">
                      {project.factory.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="truncate text-sm">
                      {project.factory.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="text-sm">
                      {formatDate(project.startDate)} — {formatDate(project.plannedEndDate)}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                  <Link href={`/projects/${project._id}`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                    >
                      Xem chi tiết dự án
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal for MANAGER */}
      {isManager && (
        <CreateProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </div>
  );
}
