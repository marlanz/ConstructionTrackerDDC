"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectOverview } from "@/lib/services/project.service";
import { LatestReportPayload } from "@/app/actions/dailyReport.actions";
import { getProjectStatusStyle } from "@/lib/status-styles";
import { formatDate } from "@/lib/i18n/formatters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MemberManagementModal } from "@/components/MemberManagementModal";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  ListTodo,
  MapPin,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { USER_ROLE_VN_LABELS, UserRoleType } from "@/app/constants/role";

interface ProjectOverviewViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  overview: ProjectOverview;
  latestReport: LatestReportPayload;
}

// ---------------------------------------------------------------------------
// CompactLatestReportCard (Sidebar variant)
// ---------------------------------------------------------------------------

interface CompactLatestReportCardProps {
  latestReport: LatestReportPayload;
  projectId: string;
}

function CompactLatestReportCard({
  latestReport,
  projectId,
}: CompactLatestReportCardProps) {
  const reportsHref = `/projects/${projectId}/reports`;

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!latestReport) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Báo cáo mới nhất</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <FileText className="h-8 w-8 text-zinc-400" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Chưa có báo cáo hiện trường nào
              </p>
              <p className="text-[11px] text-zinc-500">
                Báo cáo ngày đầu tiên sẽ xuất hiện ở đây.
              </p>
            </div>
          </div>
          <Link href={reportsHref} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
            >
              Xem tất cả báo cáo
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Content state ─────────────────────────────────────────────────────────
  const { report, dayNumber, createdByName } = latestReport;
  const reportDate = formatDate(report.date);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Báo cáo mới nhất</CardTitle>
            <CardDescription className="text-[11px]">
              Báo cáo hiện trường
            </CardDescription>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="text-[11px] font-semibold shrink-0"
        >
          Ngày {dayNumber}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meta summary */}
        <div className="space-y-2 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
              {reportDate}
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              {report.workStartTime}–{report.workEndTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
            <UserCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              Người báo cáo:{" "}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {createdByName}
              </strong>
            </span>
          </div>
        </div>

        {/* Work items list (titles only) */}
        {report.workAgenda.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Nội dung công việc ({report.workAgenda.length})
            </p>
            <div className="space-y-2">
              {report.workAgenda.map((entry, idx) => (
                <div
                  key={entry._id}
                  className="flex items-start gap-2 rounded-md border border-zinc-100 p-2.5 dark:border-zinc-800"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                    {entry.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-2 text-center">
            Chưa có mục công việc nào.
          </p>
        )}

        <Separator />

        {/* View All Link */}
        <Link href={reportsHref} className="block">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-xs"
          >
            <span>Xem tất cả báo cáo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProjectOverviewView
// ---------------------------------------------------------------------------

export function ProjectOverviewView({
  user,
  overview,
  latestReport,
}: ProjectOverviewViewProps) {
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const { project, members, taskSummary } = overview;
  const isManager = user.role === "MANAGER";
  const statusStyle = getProjectStatusStyle(project.status);

  return (
    <div className="space-y-8">
      {/* Back & Breadcrumb */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Trở về danh sách dự án
        </Link>
      </div>

      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="font-mono text-xs font-semibold"
            >
              {project.projectCode}
            </Badge>
            <Badge className={statusStyle.badgeClass}>{statusStyle.label}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {project.name}
          </h1>
        </div>

        {isManager && (
          <Button
            onClick={() => setMemberModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" /> Quản lý thành viên giám sát
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 text-sm font-medium border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <span className="text-primary font-semibold border-b-2 border-primary pb-2">
          Tổng quan
        </span>
        <Link
          href={`/projects/${project._id}/plan`}
          className="text-zinc-500 hover:text-zinc-900 pb-2 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          Kế hoạch lắp đặt ({taskSummary.totalTasks})
        </Link>
        <Link
          href={`/projects/${project._id}/reports`}
          className="text-zinc-500 hover:text-zinc-900 pb-2 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          Báo cáo hàng ngày
        </Link>
      </div>

      {/* Grid Layout (Order-1 on mobile for Latest Report sidebar so it's above the fold) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Right Column in DOM / Order 1 on mobile: Compact Latest Report Card */}
        <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
          <CompactLatestReportCard
            latestReport={latestReport}
            projectId={project._id}
          />
          {/* Card 3: Project Members (Relocated here from right column) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  Danh sách thành viên dự án
                </CardTitle>
              </div>
              {isManager && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMemberModalOpen(true)}
                >
                  Quản lý
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {members.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Chưa có giám sát viên nào được phân công.
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 font-semibold text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {member.user?.name
                            ? member.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {member.user?.name || member.userId}
                          </div>
                          {member.user?.email && (
                            <div className="text-[11px] text-zinc-500">
                              {member.user.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px]">
                        {USER_ROLE_VN_LABELS[member.user?.role as UserRoleType] || member.user?.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Left Column in DOM / Order 2 on mobile: Project Details, Task Progress, Members */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
          {/* Card 2: Task Progress Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Quá trình lắp đặt</CardTitle>
                <CardDescription>Tiến độ lắp đặt tổng quan</CardDescription>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListTodo className="h-5 w-5" />
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Tiến độ dự án
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50 font-mono">
                    {taskSummary.avgProgression}%
                  </span>
                </div>
                <Progress
                  value={taskSummary.avgProgression}
                  className="h-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">
                    Tổng mục lắp đặt
                  </span>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {taskSummary.totalTasks}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">
                    Đã hoàn thành (100%)
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {taskSummary.completedTasks}
                  </div>
                </div>
              </div>

              <Link href={`/projects/${project._id}/plan`} className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  Mở kế hoạch chi tiết lắp đặt
                  <ListTodo className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          {/* Card 1: Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết dự án</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 text-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Nhà máy
                  </span>
                  <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    {project.factory.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Vị trí
                  </span>
                  <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    {project.factory.location}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Ngày bắt đầu
                  </span>
                  <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    {formatDate(project.startDate)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Dự kiến kết thúc
                  </span>
                  <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    {formatDate(project.plannedEndDate)}
                  </div>
                </div>
              </div>

              {project.description && (
                <div className="space-y-1 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500">
                    Mô tả dự án
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}

              {project.briefPlan && (
                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <a
                    href={project.briefPlan}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> File thông tin chi
                    tiết về kế hoạch
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Management Modal */}
      <MemberManagementModal
        open={memberModalOpen}
        onOpenChange={setMemberModalOpen}
        projectId={project._id}
        projectName={project.name}
        members={members}
        isManager={isManager}
      />
    </div>
  );
}
