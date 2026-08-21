"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject } from "@/app/actions/project.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [projectCode, setProjectCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [factoryLocation, setFactoryLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [briefPlan, setBriefPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const status =
      new Date() >= new Date(startDate) ? "IN_PROGRESS" : "PLANNED";

    const result = await createProject({
      projectCode,
      name,
      description,
      factory: {
        name: factoryName,
        location: factoryLocation,
      },
      briefPlan: briefPlan || null,
      startDate,
      plannedEndDate,
      status: status,
    });

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Tạo dự án "${name}" thành công`);
    setLoading(false);
    onOpenChange(false);
    // Reset form
    setProjectCode("");
    setName("");
    setDescription("");
    setFactoryName("");
    setFactoryLocation("");
    setStartDate("");
    setPlannedEndDate("");
    setBriefPlan("");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Tạo dự án lắp đặt mới</DialogTitle>
        <DialogDescription>
          Điền các thông tin chi tiết để tạo dự án mới trong hệ thống.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Mã Dự án *</label>
            <Input
              placeholder="PRJ-2026-001"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Tên Dự án *</label>
            <Input
              placeholder="Buồng phun bi nhà máy DDC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Mô tả dự án</label>
          <Input
            placeholder="Mô tả tổng quan về dự án thi công"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nhà máy *</label>
            <Input
              placeholder="Nhà máy DDC Long An"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Địa chỉ nhà máy *</label>
            <Input
              placeholder="Đức Hòa, Tây Ninh"
              value={factoryLocation}
              onChange={(e) => setFactoryLocation(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Ngày bắt đầu *</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
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
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">
            Kế hoạch sơ bộ (File sheet/excel)
          </label>
          <Input
            placeholder="https://res.cloudinary.com/..."
            value={briefPlan}
            onChange={(e) => setBriefPlan(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo dự án"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
