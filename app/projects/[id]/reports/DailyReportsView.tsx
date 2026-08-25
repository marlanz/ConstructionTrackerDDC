"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SerializedDailyReport } from "@/lib/services/dailyReport.service";
import { SerializedInstallationTask } from "@/lib/services/installationDetail.service";
import { SerializedProject } from "@/lib/services/project.service";
import { formatDateWithWeekday } from "@/lib/i18n/formatters";
import { getProjectStatusStyle } from "@/lib/status-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateReportModal } from "@/components/CreateReportModal";
import { DailyReportCard } from "./DailyReportCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Filter,
  Plus,
  Trash2,
  Users,
  Wrench,
  Link as LinkIcon,
} from "lucide-react";

interface DailyReportsViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project: SerializedProject;
  reports: SerializedDailyReport[];
  tasks: SerializedInstallationTask[];
  isSupervisor: boolean;
}

export function DailyReportsView({
  project,
  reports,
  tasks,
  isSupervisor,
}: DailyReportsViewProps) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const statusStyle = getProjectStatusStyle(project.status);

  // Task lookup map for linked WBS items
  const taskMap = useMemo(() => {
    const map = new Map<string, SerializedInstallationTask>();
    tasks.forEach((t) => map.set(t._id, t));
    return map;
  }, [tasks]);

  // Filter reports by date range
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const rDate = new Date(report.date).getTime();
      if (fromDate) {
        const fTime = new Date(fromDate).getTime();
        if (rDate < fTime) return false;
      }
      if (toDate) {
        const tTime = new Date(toDate).getTime();
        if (rDate > tTime + 86400000) return false;
      }
      return true;
    });
  }, [reports, fromDate, toDate]);

  // Calculate construction day number relative to project start date
  const computeDayNumber = (reportDateStr: string) => {
    const startMs = new Date(project.startDate).getTime();
    const rMs = new Date(reportDateStr).getTime();
    const diffDays = Math.ceil((rMs - startMs) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  };


  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="space-y-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <Link
            href={`/projects/${project._id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Trở về Tổng quan dự án
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {project.name}
            </h1>
          </div>

          {isSupervisor && (
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tạo báo cáo hằng ngày
            </Button>
          )}
        </div>

        <div className="sm:flex justify-between flex-row items-center">
          {/* Tab Navigation */}
          <div className="flex gap-4 text-sm font-medium border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
            <Link
              href={`/projects/${project._id}`}
              className="text-zinc-500 hover:text-zinc-900 pb-1 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Tổng quan
            </Link>
            <Link
              href={`/projects/${project._id}/plan`}
              className="text-zinc-500 hover:text-zinc-900 pb-1 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Kế hoạch lắp đặt
            </Link>
            <span className="text-primary font-semibold border-b-2 border-primary pb-1">
              Báo cáo hằng ngày ({reports.length})
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                <Filter className="h-3.5 w-3.5 text-zinc-400" /> Lọc theo khoảng
                thời gian:
              </div>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-36 text-xs h-8"
                placeholder="Từ ngày"
              />
              <span className="text-xs text-zinc-400">đến</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-36 text-xs h-8"
                placeholder="Đến ngày"
              />
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="h-8 text-xs text-zinc-500"
                >
                  Xóa lọc
                </Button>
              )}
            </div>

            <div className="text-xs text-zinc-500 font-mono">
              Hiển thị {filteredReports.length} trên tổng số {reports.length}{" "}
              báo cáo
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
      </div>

      {/* Reports Timeline / List */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center text-xs text-zinc-500">
          <FileText className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
          Không tìm thấy báo cáo nhật ký nào trong khoảng thời gian đã chọn.
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => {
            const dayNumber = computeDayNumber(report.date);

            return (
              <DailyReportCard
                key={report._id}
                report={report}
                dayNumber={dayNumber}
                taskMap={taskMap}
                tasks={tasks}
                isSupervisor={isSupervisor}
              />
            );
          })}
        </div>
      )}

      {/* Create Daily Report Modal */}
      {isSupervisor && (
        <CreateReportModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          projectId={project._id}
          tasks={tasks}
        />
      )}
    </div>
  );
}
