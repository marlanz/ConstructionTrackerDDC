"use client";

import { useState, useEffect } from "react";
import { SerializedDailyReport, WorkAgendaImage } from "@/lib/services/dailyReport.service";
import { SerializedInstallationTask } from "@/lib/services/installationDetail.service";
import { formatDateWithWeekday } from "@/lib/i18n/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportPhotoGallery } from "@/components/ReportPhotoGallery";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  deleteDailyReport,
  updateDailyReport,
  updateWorkAgendaEntry,
  addWorkAgendaEntry,
  removeWorkAgendaEntry,
} from "@/app/actions/dailyReport.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Edit3,
  Link as LinkIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";

interface DailyReportCardProps {
  report: SerializedDailyReport;
  dayNumber: number;
  taskMap: Map<string, SerializedInstallationTask>;
  tasks: SerializedInstallationTask[];
  isSupervisor: boolean;
}

interface EditableAgendaEntry {
  _id?: string;
  title: string;
  description: string;
  taskId: string;
  imgUrl: WorkAgendaImage[];
  isNew?: boolean;
}

export function DailyReportCard({
  report,
  dayNumber,
  taskMap,
  tasks,
  isSupervisor,
}: DailyReportCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Report-level edit form states
  const [date, setDate] = useState("");
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [machineryText, setMachineryText] = useState("");
  const [personnel, setPersonnel] = useState<
    { party: string; role: string; amount: number; note: string | null }[]
  >([]);
  const [agendaEntries, setAgendaEntries] = useState<EditableAgendaEntry[]>([]);

  // Deletion modals state
  const [deleteReportOpen, setDeleteReportOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);
  const [entryToRemove, setEntryToRemove] = useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [removingEntry, setRemovingEntry] = useState(false);

  // Initialize edit form when entering edit mode or when report updates
  const initFormValues = () => {
    const formattedDate = report.date ? report.date.substring(0, 10) : "";
    setDate(formattedDate);
    setWorkStartTime(report.workStartTime || "07:00");
    setWorkEndTime(report.workEndTime || "18:00");
    setMachineryText((report.installationMachine || []).join(", "));
    setPersonnel(
      (report.installationPersonel || []).map((p) => ({
        party: p.party,
        role: p.role,
        amount: p.amount,
        note: p.note ?? null,
      })),
    );
    setAgendaEntries(
      (report.workAgenda || []).map((entry) => ({
        _id: entry._id,
        title: entry.title,
        description: entry.description || "",
        taskId: entry.taskId || "",
        imgUrl: entry.imgUrl || [],
      })),
    );
  };

  useEffect(() => {
    if (!isEditing) {
      initFormValues();
    }
  }, [report, isEditing]);

  const handleStartEdit = () => {
    initFormValues();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    initFormValues();
    setIsEditing(false);
  };

  // Personnel handlers
  const handleAddPersonnel = () => {
    setPersonnel([
      ...personnel,
      { party: "CONTRACTOR", role: "Công nhân", amount: 1, note: null },
    ]);
  };

  const handleRemovePersonnel = (idx: number) => {
    setPersonnel(personnel.filter((_, i) => i !== idx));
  };

  // Work agenda handlers
  const handleAddAgendaEntry = () => {
    setAgendaEntries([
      ...agendaEntries,
      {
        title: "",
        description: "",
        taskId: "",
        imgUrl: [],
        isNew: true,
      },
    ]);
  };

  const handleRequestRemoveAgendaEntry = (
    entry: EditableAgendaEntry,
    index: number,
  ) => {
    if (entry.isNew || !entry._id) {
      setAgendaEntries(agendaEntries.filter((_, i) => i !== index));
      return;
    }
    setEntryToRemove({ _id: entry._id, title: entry.title || `Mục #${index + 1}` });
  };

  const handleConfirmRemoveAgendaEntry = async () => {
    if (!entryToRemove) return;
    setRemovingEntry(true);

    const res = await removeWorkAgendaEntry(report._id, entryToRemove._id);
    setRemovingEntry(false);
    setEntryToRemove(null);

    if (res.success) {
      toast.success("Đã xóa hạng mục công việc thành công");
      setAgendaEntries((prev) => prev.filter((e) => e._id !== entryToRemove._id));
      router.refresh();
    } else {
      toast.error(res.error || "Xóa hạng mục công việc thất bại");
    }
  };

  // Report deletion handler
  const handleConfirmDeleteReport = async () => {
    setDeletingReport(true);
    const res = await deleteDailyReport(report._id);
    setDeletingReport(false);
    setDeleteReportOpen(false);

    if (res.success) {
      toast.success("Đã xóa báo cáo nhật ký công trình thành công");
      router.refresh();
    } else {
      toast.error(res.error || "Xóa báo cáo nhật ký thất bại");
    }
  };

  // Save report updates
  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const machines = machineryText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Validate agenda entries
    const validEntries = agendaEntries.filter((a) => a.title.trim().length > 0);
    if (validEntries.length === 0) {
      toast.error("Báo cáo cần có ít nhất một hạng mục công việc có tiêu đề");
      setSaving(false);
      return;
    }

    try {
      // 1. Update report-level fields
      const reportRes = await updateDailyReport(report._id, {
        date,
        workStartTime,
        workEndTime,
        installationMachine: machines,
        installationPersonel: personnel,
      });

      if (!reportRes.success) {
        toast.error(reportRes.error || "Cập nhật báo cáo thất bại");
        setSaving(false);
        return;
      }

      // 2. Update modified existing agenda entries and add new agenda entries
      for (const entry of agendaEntries) {
        if (entry.isNew) {
          if (entry.title.trim().length > 0) {
            const addRes = await addWorkAgendaEntry(report._id, {
              title: entry.title.trim(),
              description: entry.description ? entry.description.trim() : null,
              taskId: entry.taskId || null,
              imgUrl: [],
            });
            if (!addRes.success) {
              toast.error(addRes.error || "Thêm hạng mục công việc thất bại");
            }
          }
        } else if (entry._id) {
          const original = report.workAgenda.find((e) => e._id === entry._id);
          const hasChanged =
            !original ||
            original.title !== entry.title.trim() ||
            (original.description || "") !== entry.description.trim() ||
            (original.taskId || "") !== (entry.taskId || "");

          if (hasChanged) {
            const updateRes = await updateWorkAgendaEntry(report._id, entry._id, {
              title: entry.title.trim(),
              description: entry.description ? entry.description.trim() : null,
              taskId: entry.taskId || null,
            });
            if (!updateRes.success) {
              toast.error(updateRes.error || "Cập nhật hạng mục công việc thất bại");
            }
          }
        }
      }

      toast.success("Đã lưu các thay đổi của báo cáo thành công");
      setIsEditing(false);
      setSaving(false);
      router.refresh();
    } catch (err: unknown) {
      console.error("Error saving daily report:", err);
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu báo cáo";
      toast.error(msg);
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
      {isEditing ? (
        <form onSubmit={handleSaveReport}>
          {/* Edit Mode Header */}
          <CardHeader className="bg-zinc-50/80 border-b border-zinc-200 p-4 sm:p-6 dark:bg-zinc-900/80 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary text-primary-foreground font-mono font-bold">
                  Ngày {dayNumber} (Chỉnh sửa)
                </Badge>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Ngày:
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-8 w-40 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    required
                    className="h-8 w-24 text-xs font-mono"
                  />
                  <span className="text-zinc-400">—</span>
                  <Input
                    type="time"
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                    required
                    className="h-8 w-24 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="h-8 text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="h-8 text-xs gap-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Machinery & Personnel Edit Fields */}
            <div className="space-y-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                  Máy móc / Thiết bị (phân cách bằng dấu phẩy):
                </label>
                <Input
                  value={machineryText}
                  onChange={(e) => setMachineryText(e.target.value)}
                  placeholder="Cẩu 25T, Máy hàn MIG, Xe nâng"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    Nhân sự thi công ({personnel.length}):
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPersonnel}
                    className="h-6 text-[11px] px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Thêm nhân sự
                  </Button>
                </div>

                <div className="space-y-1.5">
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
                        className="h-7 text-xs w-1/4"
                      />
                      <Input
                        placeholder="Chức danh / Vai trò"
                        value={p.role}
                        onChange={(e) => {
                          const updated = [...personnel];
                          updated[idx].role = e.target.value;
                          setPersonnel(updated);
                        }}
                        className="h-7 text-xs w-1/3"
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
                        className="h-7 text-xs w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePersonnel(idx)}
                        className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Edit Mode Content */}
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Nội dung công việc ({agendaEntries.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAgendaEntry}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Thêm hạng mục
                </Button>
              </div>

              {agendaEntries.map((entry, idx) => (
                <div
                  key={entry._id || `new-${idx}`}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">
                      Hạng mục #{idx + 1} {entry.isNew && "(Mới)"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRequestRemoveAgendaEntry(entry, idx)}
                      className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa mục
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Tiêu đề công việc *"
                      value={entry.title}
                      onChange={(e) => {
                        const updated = [...agendaEntries];
                        updated[idx].title = e.target.value;
                        setAgendaEntries(updated);
                      }}
                      required
                      className="h-8 text-xs font-medium"
                    />

                    <Input
                      placeholder="Mô tả chi tiết / Ghi chú (không bắt buộc)"
                      value={entry.description}
                      onChange={(e) => {
                        const updated = [...agendaEntries];
                        updated[idx].description = e.target.value;
                        setAgendaEntries(updated);
                      }}
                      className="h-8 text-xs"
                    />

                    {tasks.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500">
                          Liên kết tới công việc WBS (không bắt buộc):
                        </label>
                        <select
                          value={entry.taskId}
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

                  {/* Photo Gallery with delete overlay and upload */}
                  {entry._id && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <ReportPhotoGallery
                        reportId={report._id}
                        entryId={entry._id}
                        images={entry.imgUrl || []}
                        isSupervisor={isSupervisor}
                        isEditMode={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </form>
      ) : (
        /* View Mode */
        <>
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-4 sm:p-6 dark:bg-zinc-900/50 dark:border-zinc-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 font-mono font-bold">
                  Ngày {dayNumber}
                </Badge>
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    {formatDateWithWeekday(report.date)}
                  </CardTitle>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  {report.workStartTime} — {report.workEndTime}
                </div>

                {isSupervisor && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartEdit}
                      className="h-8 w-8 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                      title="Chỉnh sửa báo cáo"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteReportOpen(true)}
                      className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Xóa báo cáo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Bar: Machinery & Personnel */}
            <div className="flex flex-wrap gap-4 pt-3 text-xs text-zinc-600 dark:text-zinc-400">
              {report.installationMachine &&
                report.installationMachine.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-medium">Thiết bị/Máy móc:</span>
                    <div className="flex flex-wrap gap-1">
                      {report.installationMachine.map((m, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] py-0 px-1.5"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {report.installationPersonel &&
                report.installationPersonel.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="font-medium">Nhân lực:</span>
                    <span>
                      {report.installationPersonel
                        .map((p) => `${p.amount} ${p.role}`)
                        .join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Work Agenda Entries */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Nội dung công việc ({report.workAgenda.length})
              </h4>

              {report.workAgenda.map((entry) => {
                const linkedTask = entry.taskId
                  ? taskMap.get(entry.taskId)
                  : null;

                return (
                  <div
                    key={entry._id}
                    className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3 dark:border-zinc-800/80 dark:bg-zinc-950"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {entry.title}
                        </h5>
                        {linkedTask && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono gap-1"
                          >
                            <LinkIcon className="h-3 w-3" />[
                            {linkedTask.sectionCode || "WBS"}]{" "}
                            {linkedTask.agenda} ({linkedTask.progression}%)
                          </Badge>
                        )}
                      </div>

                      {entry.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    {/* Photo Gallery & Cloudinary Upload */}
                    <ReportPhotoGallery
                      reportId={report._id}
                      entryId={entry._id}
                      images={entry.imgUrl || []}
                      isSupervisor={isSupervisor}
                      isEditMode={false}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </>
      )}

      {/* Delete Single Entry Confirmation Dialog */}
      <AlertDialog
        open={!!entryToRemove}
        onOpenChange={(open) => !open && !removingEntry && setEntryToRemove(null)}
        title="Xóa hạng mục công việc?"
        description={`Bạn có chắc chắn muốn xóa hạng mục "${entryToRemove?.title}"? Tất cả hình ảnh liên quan trong hạng mục này sẽ bị xóa vĩnh viễn khỏi Cloudinary và báo cáo.`}
        confirmLabel="Xóa hạng mục"
        variant="destructive"
        loading={removingEntry}
        onConfirm={handleConfirmRemoveAgendaEntry}
      />

      {/* Delete Report Confirmation Dialog */}
      <AlertDialog
        open={deleteReportOpen}
        onOpenChange={(open) => !open && !deletingReport && setDeleteReportOpen(false)}
        title="Xóa báo cáo nhật ký công trình?"
        description="Bạn có chắc chắn muốn xóa báo cáo hằng ngày này? Tất cả các nhật ký công việc và hình ảnh liên quan của ngày này sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu."
        confirmLabel="Xóa báo cáo"
        variant="destructive"
        loading={deletingReport}
        onConfirm={handleConfirmDeleteReport}
      />
    </Card>
  );
}
