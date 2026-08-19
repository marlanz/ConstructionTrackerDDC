"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { updateTaskProgress } from "@/app/actions/installationDetail.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UpdateProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    _id: string;
    agenda: string;
    progression: number;
  } | null;
}

export function UpdateProgressModal({
  open,
  onOpenChange,
  task,
}: UpdateProgressModalProps) {
  const router = useRouter();
  const [progression, setProgression] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setProgression(task.progression);
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const val = Math.min(100, Math.max(0, Number(progression)));
    const result = await updateTaskProgress(task._id, val);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Đã cập nhật tiến độ công việc thành ${val}%`);
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Cập nhật tiến độ công việc</DialogTitle>
        <DialogDescription className="line-clamp-2">
          {task.agenda}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tỷ lệ phần trăm hoàn thành</span>
            <span className="font-mono text-lg font-bold">{progression}%</span>
          </div>

          <Progress value={Number(progression)} className="h-3" />

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progression}
              onChange={(e) => setProgression(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
            />
            <Input
              type="number"
              min="0"
              max="100"
              value={progression}
              onChange={(e) => setProgression(Number(e.target.value))}
              className="w-20 font-mono text-center"
            />
          </div>

          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={progression === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setProgression(preset)}
                className="flex-1 text-xs"
              >
                {preset}%
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu tiến độ"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
