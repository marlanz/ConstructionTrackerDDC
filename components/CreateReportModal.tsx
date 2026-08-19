"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDailyReport } from "@/app/actions/dailyReport.actions";
import { SerializedInstallationTask } from "@/lib/services/installationDetail.service";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n/formatters";

interface CreateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  tasks: SerializedInstallationTask[];
}

export function CreateReportModal({
  open,
  onOpenChange,
  projectId,
  tasks,
}: CreateReportModalProps) {
  const router = useRouter();

  const todayStr = new Date().toISOString().substring(0, 10);
  const [date, setDate] = useState(todayStr);
  const [workStartTime, setWorkStartTime] = useState("07:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");
  const [machineryText, setMachineryText] = useState("");

  const [personnel, setPersonnel] = useState<{ party: string; role: string; amount: number; note: string }[]>([
    { party: "CONTRACTOR", role: "Giám sát", amount: 1, note: "" },
    { party: "CONTRACTOR", role: "Công nhân", amount: 4, note: "" },
  ]);

  const [agendaEntries, setAgendaEntries] = useState<{ title: string; description: string; taskId: string }[]>([
    { title: "", description: "", taskId: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPersonnel = () => {
    setPersonnel([...personnel, { party: "CONTRACTOR", role: "Công nhân", amount: 1, note: "" }]);
  };

  const handleRemovePersonnel = (idx: number) => {
    setPersonnel(personnel.filter((_, i) => i !== idx));
  };

  const handleAddAgenda = () => {
    setAgendaEntries([...agendaEntries, { title: "", description: "", taskId: "" }]);
  };

  const handleRemoveAgenda = (idx: number) => {
    setAgendaEntries(agendaEntries.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const machines = machineryText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedAgenda = agendaEntries
      .filter((a) => a.title.trim().length > 0)
      .map((a) => ({
        title: a.title.trim(),
        description: a.description ? a.description.trim() : null,
        taskId: a.taskId || null,
        imgUrl: [],
      }));

    if (formattedAgenda.length === 0) {
      setError("Vui lòng thêm ít nhất một mục công việc cho báo cáo.");
      setLoading(false);
      return;
    }

    const inputData = {
      date,
      workStartTime,
      workEndTime,
      installationMachine: machines,
      installationPersonel: personnel,
      workAgenda: formattedAgenda,
    };

    const result = await createDailyReport(projectId, inputData);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`Đã gửi báo cáo ngày ${formatDate(date)} thành công`);
    setLoading(false);
    onOpenChange(false);
    // Reset form
    setDate(todayStr);
    setMachineryText("");
    setAgendaEntries([{ title: "", description: "", taskId: "" }]);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Tạo báo cáo nhật ký công trình hàng ngày</DialogTitle>
        <DialogDescription>
          Ghi nhận nhật ký thi công hàng ngày, giờ làm việc, nhân lực, thiết bị và các mục công việc.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Ngày báo cáo *</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Giờ bắt đầu *</label>
            <Input
              type="time"
              value={workStartTime}
              onChange={(e) => setWorkStartTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Giờ kết thúc *</label>
            <Input
              type="time"
              value={workEndTime}
              onChange={(e) => setWorkEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Máy móc / Thiết bị sử dụng (phân cách bằng dấu phẩy)</label>
          <Input
            placeholder="Cẩu 25T, Máy hàn MIG, Xe nâng 5T"
            value={machineryText}
            onChange={(e) => setMachineryText(e.target.value)}
          />
        </div>

        {/* Dynamic Personnel */}
        <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nhân sự / Lực lượng thi công ({personnel.length})
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddPersonnel} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Thêm nhân sự
            </Button>
          </div>

          {personnel.map((p, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Đơn vị (Party)"
                value={p.party}
                onChange={(e) => {
                  const updated = [...personnel];
                  updated[idx].party = e.target.value;
                  setPersonnel(updated);
                }}
                className="w-1/4"
              />
              <Input
                placeholder="Chức danh / Vai trò"
                value={p.role}
                onChange={(e) => {
                  const updated = [...personnel];
                  updated[idx].role = e.target.value;
                  setPersonnel(updated);
                }}
                className="w-1/3"
              />
              <Input
                type="number"
                placeholder="Số lượng"
                value={p.amount}
                onChange={(e) => {
                  const updated = [...personnel];
                  updated[idx].amount = Number(e.target.value);
                  setPersonnel(updated);
                }}
                className="w-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePersonnel(idx)}
                className="h-8 w-8 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Work Agenda Repeatable Entries */}
        <div className="space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Các hạng mục công việc ({agendaEntries.length}) *
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddAgenda} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Thêm mục công việc
            </Button>
          </div>

          {agendaEntries.map((item, idx) => (
            <div
              key={idx}
              className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500">
                  Mục #{idx + 1}
                </span>
                {agendaEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(idx)}
                    className="text-red-500 text-xs hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                )}
              </div>

              <Input
                placeholder="Tiêu đề công việc (VD: Thi công nền móng buồng phun bi)"
                value={item.title}
                onChange={(e) => {
                  const updated = [...agendaEntries];
                  updated[idx].title = e.target.value;
                  setAgendaEntries(updated);
                }}
                required
              />

              <Input
                placeholder="Mô tả / Ghi chú (không bắt buộc)"
                value={item.description}
                onChange={(e) => {
                  const updated = [...agendaEntries];
                  updated[idx].description = e.target.value;
                  setAgendaEntries(updated);
                }}
              />

              {tasks.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500">
                    Liên kết tới công việc trong Kế hoạch WBS (không bắt buộc)
                  </label>
                  <select
                    value={item.taskId}
                    onChange={(e) => {
                      const updated = [...agendaEntries];
                      updated[idx].taskId = e.target.value;
                      setAgendaEntries(updated);
                    }}
                    className="w-full rounded-md border border-zinc-200 bg-white p-1.5 text-xs text-zinc-900 shadow-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="">-- Không liên kết công việc --</option>
                    {tasks.map((t) => (
                      <option key={t._id} value={t._id}>
                        [{t.sectionCode || "WBS"}] {t.agenda} ({t.progression}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi báo cáo nhật ký"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
