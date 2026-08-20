"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteProject } from "@/app/actions/project.actions";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectCode: string;
  projectName: string;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectCode,
  projectName,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset input and error whenever dialog opens or closes
  useEffect(() => {
    if (!open) {
      setConfirmInput("");
      setError(null);
    }
  }, [open]);

  const isMatched = confirmInput.trim() === projectCode.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched || loading) return;

    setLoading(true);
    setError(null);

    const result = await deleteProject(projectId, confirmInput.trim());

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Dự án "${projectName}" (${projectCode}) đã được xóa thành công.`);
    setLoading(false);
    onOpenChange(false);
    router.push("/projects");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Xóa vĩnh viễn dự án
            </DialogTitle>
            <DialogDescription>
              Hành động này mang tính phá hủy và không thể hoàn tác.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleDelete} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3.5 text-xs text-zinc-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-zinc-300 space-y-2">
          <p className="font-semibold text-red-800 dark:text-red-300">
            Toàn bộ dữ liệu sau sẽ bị xóa vĩnh viễn khỏi hệ thống:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Thông tin và hồ sơ dự án <strong>{projectName}</strong></li>
            <li>Toàn bộ phân công giám sát viên của dự án</li>
            <li>Toàn bộ kế hoạch và tiến độ lắp đặt chi tiết</li>
            <li>Tất cả các báo cáo nhật ký công trình hàng ngày và hình ảnh đính kèm</li>
          </ul>
        </div>

        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed block">
            Để xác nhận, vui lòng nhập chính xác mã dự án{" "}
            <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-mono font-bold text-red-600 select-all dark:bg-zinc-800 dark:text-red-400">
              {projectCode}
            </span>{" "}
            vào ô bên dưới:
          </label>
          <Input
            placeholder={projectCode}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={loading}
            autoFocus
            className="font-mono text-sm"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={!isMatched || loading}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? "Đang xóa dữ liệu..." : "Xác nhận xóa dự án này"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
