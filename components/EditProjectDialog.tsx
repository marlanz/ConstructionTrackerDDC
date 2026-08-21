"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateProject } from "@/app/actions/project.actions";
import { SerializedProject } from "@/lib/services/project.service";
import {
  EDITABLE_PROJECT_STATUSES,
  EditableProjectStatus,
  PROJECT_STATUS_MAP,
  getProjectStatusStyle,
} from "@/lib/status-styles";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Calendar } from "lucide-react";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: SerializedProject;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: EditProjectDialogProps) {
  const router = useRouter();

  const [projectCode, setProjectCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [factoryLocation, setFactoryLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [actualEndDate, setActualEndDate] = useState("");
  const [briefPlan, setBriefPlan] = useState("");
  const [status, setStatus] = useState<string>("IN_PROGRESS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever dialog opens or project changes
  useEffect(() => {
    if (open && project) {
      setProjectCode(project.projectCode || "");
      setName(project.name || "");
      setDescription(project.description || "");
      setFactoryName(project.factory?.name || "");
      setFactoryLocation(project.factory?.location || "");
      setStartDate(
        project.startDate ? project.startDate.substring(0, 10) : ""
      );
      setPlannedEndDate(
        project.plannedEndDate ? project.plannedEndDate.substring(0, 10) : ""
      );
      setActualEndDate(
        project.actualEndDate ? project.actualEndDate.substring(0, 10) : ""
      );
      setBriefPlan(project.briefPlan || "");
      setStatus(project.status || "IN_PROGRESS");
      setError(null);
    }
  }, [open, project]);

  const handleStatusSelect = (newStatus: EditableProjectStatus) => {
    setStatus(newStatus);
    // If completing project and actualEndDate is not set, default to today's date
    if (newStatus === "COMPLETED" && !actualEndDate) {
      const today = new Date().toISOString().substring(0, 10);
      setActualEndDate(today);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      projectCode: projectCode.trim(),
      name: name.trim(),
      description: description.trim(),
      factory: {
        name: factoryName.trim(),
        location: factoryLocation.trim(),
      },
      startDate,
      plannedEndDate,
      actualEndDate: actualEndDate ? actualEndDate : null,
      briefPlan: briefPlan.trim() || null,
      status: status as any,
    };

    const result = await updateProject(project._id, payload);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Cập nhật thông tin dự án "${name}" thành công`);
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogHeader>
        <DialogTitle>Chỉnh sửa thông tin dự án</DialogTitle>
        <DialogDescription>
          Cập nhật thông tin chi tiết và trạng thái hoạt động của dự án.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Status Selection (Restricted to IN_PROGRESS, COMPLETED, CANCELLED) */}
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Trạng thái dự án *
            </label>
            <Badge className={getProjectStatusStyle(status).badgeClass}>
              {getProjectStatusStyle(status).label}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {EDITABLE_PROJECT_STATUSES.map((itemStatus) => {
              const isSelected = status === itemStatus;
              const style = PROJECT_STATUS_MAP[itemStatus];

              return (
                <button
                  key={itemStatus}
                  type="button"
                  onClick={() => handleStatusSelect(itemStatus)}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-lg border p-2.5 text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 font-semibold shadow-xs ring-1 ring-primary"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      itemStatus === "IN_PROGRESS"
                        ? "bg-amber-500"
                        : itemStatus === "COMPLETED"
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span className="text-xs text-zinc-900 dark:text-zinc-100 leading-tight">
                    {style.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {itemStatus === "COMPLETED" ? "FINISHED" : itemStatus}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basic Project Info */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Mã Dự án *</label>
            <Input
              placeholder="PRJ-2026-001"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Tên Dự án *</label>
            <Input
              placeholder="Tên dự án thi công"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Mô tả dự án</label>
          <Input
            placeholder="Mô tả tổng quan về dự án thi công"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Factory Info */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nhà máy *</label>
            <Input
              placeholder="Tên nhà máy"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Địa chỉ nhà máy *</label>
            <Input
              placeholder="Địa chỉ nhà máy"
              value={factoryLocation}
              onChange={(e) => setFactoryLocation(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Ngày bắt đầu *</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">
              Ngày dự kiến kết thúc *
            </label>
            <Input
              type="date"
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Actual End Date (optional / completion) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Ngày kết thúc thực tế (tùy chọn)
            </label>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().substring(0, 10);
                setActualEndDate(today);
              }}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="h-3 w-3" /> Hôm nay
            </button>
          </div>
          <Input
            type="date"
            value={actualEndDate}
            onChange={(e) => setActualEndDate(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Brief Plan URL */}
        <div className="space-y-1">
          <label className="text-xs font-medium">
            Kế hoạch sơ bộ (File sheet / URL)
          </label>
          <Input
            placeholder="https://docs.google.com/spreadsheets/..."
            value={briefPlan}
            onChange={(e) => setBriefPlan(e.target.value)}
            disabled={loading}
          />
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
