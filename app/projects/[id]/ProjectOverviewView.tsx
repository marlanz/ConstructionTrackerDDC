"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectOverview } from "@/lib/services/project.service";
import { getProjectStatusStyle } from "@/lib/status-styles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MemberManagementModal } from "@/components/MemberManagementModal";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ListTodo,
  MapPin,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { USER_ROLE_VN_LABELS } from "@/app/constants/role";

interface ProjectOverviewViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  overview: ProjectOverview;
}

export function ProjectOverviewView({
  user,
  overview,
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
            <Badge className={statusStyle.badgeClass}>Đang triển khai</Badge>
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
        <span className="text-zinc-900 font-semibold border-b-2 border-zinc-900 pb-2 dark:text-zinc-100 dark:border-zinc-100">
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

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Project Details & Description */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết dự án</CardTitle>
              {/* <CardDescription>
                Core location, schedule, and reference documents
              </CardDescription> */}
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
                    {new Date(project.startDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-zinc-500">
                    Dự kiến kết thúc
                  </span>
                  <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    {new Date(project.plannedEndDate).toLocaleDateString()}
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
                    className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> File thông tin chi
                    tiết về kế hoạch
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Progress Summary Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Quá trình lắp đặt</CardTitle>
                <CardDescription>Tiến độ lắp đặt tổng quan</CardDescription>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
        </div>

        {/* Right Column: Project Members / Supervisors */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  Danh sách thành viên dự án
                </CardTitle>
                {/* <CardDescription>Thành viên</CardDescription> */}
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
                  No supervisors assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
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
                        {USER_ROLE_VN_LABELS[member.user?.role]}
                      </Badge>
                    </div>
                  ))}
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
