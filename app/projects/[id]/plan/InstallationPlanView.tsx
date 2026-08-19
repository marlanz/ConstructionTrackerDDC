"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SerializedInstallationTask } from "@/lib/services/installationDetail.service";
import { SerializedProject } from "@/lib/services/project.service";
import { formatDate } from "@/lib/i18n/formatters";
import { getProjectStatusStyle } from "@/lib/status-styles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { TaskFormModal } from "@/components/TaskFormModal";
import { UpdateProgressModal } from "@/components/UpdateProgressModal";
import { reorderInstallationTasks } from "@/app/actions/installationDetail.actions";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Edit2,
  ListTodo,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface InstallationPlanViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project: SerializedProject;
  tasks: SerializedInstallationTask[];
  isSupervisor: boolean;
}

export function InstallationPlanView({
  project,
  tasks,
  isSupervisor,
}: InstallationPlanViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");

  const statusStyle = getProjectStatusStyle(project.status);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] =
    useState<SerializedInstallationTask | null>(null);

  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [taskForProgress, setTaskForProgress] =
    useState<SerializedInstallationTask | null>(null);

  const [reordering, setReordering] = useState(false);

  // Extract unique section codes
  const uniqueSections = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.sectionCode) set.add(t.sectionCode);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Filter tasks by search query and section
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.agenda.toLowerCase().includes(search.toLowerCase()) ||
        (t.installationLocation &&
          t.installationLocation
            .toLowerCase()
            .includes(search.toLowerCase())) ||
        (t.installationEquipments || []).some((e) =>
          e.toLowerCase().includes(search.toLowerCase()),
        );

      const matchesSection =
        sectionFilter === "ALL" ||
        (t.sectionCode && t.sectionCode === sectionFilter);

      return matchesSearch && matchesSection;
    });
  }, [tasks, search, sectionFilter]);

  // Overall progression calculation
  const avgProgression = useMemo(() => {
    if (tasks.length === 0) return 0;
    const sum = tasks.reduce((acc, t) => acc + (t.progression || 0), 0);
    return Math.round(sum / tasks.length);
  }, [tasks]);

  // Move task up or down in sequence
  const handleMoveSequence = async (
    index: number,
    direction: "up" | "down",
  ) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;

    setReordering(true);
    const updatedTaskIds = tasks.map((t) => t._id);
    const temp = updatedTaskIds[index];
    updatedTaskIds[index] = updatedTaskIds[targetIndex];
    updatedTaskIds[targetIndex] = temp;

    await reorderInstallationTasks(project._id, updatedTaskIds);
    setReordering(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Navigation tabs & Header */}
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
              <Badge className={statusStyle.badgeClass}>{statusStyle.label}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {project.name}
            </h1>
          </div>

          {isSupervisor && (
            <Button
              onClick={() => {
                setTaskToEdit(null);
                setFormModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Thêm kế hoạch
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 text-sm font-medium border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
          <Link
            href={`/projects/${project._id}`}
            className="text-zinc-500 hover:text-zinc-900 pb-1 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Tổng quan
          </Link>
          <span className="text-primary font-semibold border-b-2 border-primary pb-1">
            Kế hoạch lắp đặt ({tasks.length})
          </span>
          <Link
            href={`/projects/${project._id}/reports`}
            className="text-zinc-500 hover:text-zinc-900 pb-1 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Báo cáo hằng ngày
          </Link>
        </div>
      </div>

      {/* Overview Progress Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Tổng quan tiến độ lắp đặt</span>
                <span className="font-mono font-bold">{avgProgression}%</span>
              </div>
              <Progress value={avgProgression} className="h-2.5" />
            </div>

            <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400 border-l border-zinc-200 pl-4 dark:border-zinc-800">
              <div>
                <div className="text-zinc-400">Tổng cộng</div>
                <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {tasks.length < 10 ? `0${tasks.length}` : tasks.length}
                </div>
              </div>
              <div>
                <div className="text-zinc-400">Đã hoàn thành</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {tasks.filter((t) => t.progression >= 100).length < 10
                    ? `0${tasks.filter((t) => t.progression >= 100).length}`
                    : tasks.filter((t) => t.progression >= 100).length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm hạng mục, vị trí, thiết bị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {uniqueSections.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-500">Hạng mục:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="ALL">Tất cả hạng mục ({tasks.length})</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  Hạng mục {sec}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task Table */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center text-xs text-zinc-500">
          <ListTodo className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
          Không có hạng mục lắp đặt nào phù hợp với tìm kiếm hoặc bộ lọc.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {isSupervisor && <TableHead className="w-16">Thứ tự</TableHead>}
                <TableHead className="w-20">STT</TableHead>
                <TableHead className="w-100">Hạng mục công việc</TableHead>
                <TableHead>Vị trí & Thiết bị</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="w-36">Tiến độ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTasks.map((task, idx) => (
                <TableRow key={task._id}>
                  {/* Sequence & Reorder controls for Supervisors */}
                  {isSupervisor && (
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-4 font-bold">{idx + 1}</span>
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0 || reordering}
                            onClick={() => handleMoveSequence(idx, "up")}
                            className="p-0.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-100 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            disabled={
                              idx === filteredTasks.length - 1 || reordering
                            }
                            onClick={() => handleMoveSequence(idx, "down")}
                            className="p-0.5 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-100 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {/* Section Code */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {idx + 1}
                    </Badge>
                  </TableCell>

                  {/* Work Agenda */}
                  <TableCell>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                      {task.agenda}
                    </div>
                    {(task.qty !== null || task.unit || task.dimension) && (
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {task.qty !== null && (
                          <span className="text-xs">
                            Số lượng linh kiện: {task.qty}{" "}
                            {task.unit && <span>{task.unit} </span>}
                          </span>
                        )}

                        {task.dimension && (
                          <span className="italic">({task.dimension})</span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Location & Equipment */}
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {task.installationLocation && (
                        <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
                          <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                          {task.installationLocation}
                        </div>
                      )}

                      {task.installationEquipments &&
                        task.installationEquipments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {task.installationEquipments.map((eq, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[12px] py-0 px-1 "
                              >
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  </TableCell>

                  {/* Planned Dates */}
                  <TableCell className="text-xs">
                    <div className="text-zinc-700 dark:text-zinc-300">
                      {formatDate(task.plannedStartDate)}
                    </div>
                    <div className="text-zinc-400 text-[11px]">
                      đến {formatDate(task.plannedEndDate)}
                    </div>
                  </TableCell>

                  {/* Progress Bar & Quick Update */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {task.progression}%
                        </span>
                        {isSupervisor && (
                          <button
                            onClick={() => {
                              setTaskForProgress(task);
                              setProgressModalOpen(true);
                            }}
                            className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                          >
                            Cập nhật
                          </button>
                        )}
                      </div>
                      <Progress value={task.progression} className="h-2" />
                    </div>
                  </TableCell>

                  {/* Edit action */}
                  <TableCell className="text-right">
                    {isSupervisor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTaskToEdit(task);
                          setFormModalOpen(true);
                        }}
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                        title="Chỉnh sửa chi tiết hạng mục"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Task Form Modal */}
      {isSupervisor && (
        <TaskFormModal
          open={formModalOpen}
          onOpenChange={setFormModalOpen}
          projectId={project._id}
          taskToEdit={taskToEdit}
        />
      )}

      {/* Update Progress Modal */}
      {isSupervisor && (
        <UpdateProgressModal
          open={progressModalOpen}
          onOpenChange={setProgressModalOpen}
          task={taskForProgress}
        />
      )}
    </div>
  );
}
