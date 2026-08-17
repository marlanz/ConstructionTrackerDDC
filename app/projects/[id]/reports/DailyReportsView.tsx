"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SerializedDailyReport } from "@/lib/services/dailyReport.service";
import { SerializedInstallationTask } from "@/lib/services/installationDetail.service";
import { SerializedProject } from "@/lib/services/project.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateReportModal } from "@/components/CreateReportModal";
import { ReportPhotoGallery } from "@/components/ReportPhotoGallery";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { deleteDailyReport } from "@/app/actions/dailyReport.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Filter,
  HardHat,
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
  user,
  project,
  reports,
  tasks,
  isSupervisor,
}: DailyReportsViewProps) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // AlertDialog state for deleting report
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteReport = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    const res = await deleteDailyReport(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    if (res.success) {
      toast.success("Daily site report deleted successfully");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete daily report");
    }
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
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Project Overview
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {project.projectCode}
              </Badge>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                Daily Site Reports
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{project.name}</p>
          </div>

          {isSupervisor && (
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> File Daily Report
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 text-sm font-medium border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
          <Link
            href={`/projects/${project._id}`}
            className="text-zinc-500 hover:text-zinc-900 pb-1 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Overview
          </Link>
          <Link
            href={`/projects/${project._id}/plan`}
            className="text-zinc-500 hover:text-zinc-900 pb-1 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Installation Plan
          </Link>
          <span className="text-zinc-900 font-semibold border-b-2 border-zinc-900 pb-1 dark:text-zinc-100 dark:border-zinc-100">
            Daily Reports ({reports.length})
          </span>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Filter className="h-3.5 w-3.5 text-zinc-400" /> Filter Date Range:
          </div>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-36 text-xs h-8"
            placeholder="From Date"
          />
          <span className="text-xs text-zinc-400">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-36 text-xs h-8"
            placeholder="To Date"
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
              Clear
            </Button>
          )}
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      </div>

      {/* Reports Timeline / List */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center text-xs text-zinc-500">
          <FileText className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
          No daily site reports found for the selected date range.
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => {
            const dayNumber = computeDayNumber(report.date);

            return (
              <Card key={report._id} className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-4 sm:p-6 dark:bg-zinc-900/50 dark:border-zinc-800/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 font-mono font-bold">
                        Day {dayNumber}
                      </Badge>
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          {new Date(report.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </CardTitle>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        {report.workStartTime} — {report.workEndTime}
                      </div>

                      {isSupervisor && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTargetId(report._id)}
                          className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Summary Bar: Machinery & Personnel */}
                  <div className="flex flex-wrap gap-4 pt-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {report.installationMachine && report.installationMachine.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-medium">Machines:</span>
                        <div className="flex flex-wrap gap-1">
                          {report.installationMachine.map((m, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.installationPersonel && report.installationPersonel.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-medium">Crew:</span>
                        <span>
                          {report.installationPersonel.map((p) => `${p.amount} ${p.role}`).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Work Agenda Entries */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Work Agenda ({report.workAgenda.length})
                    </h4>

                    {report.workAgenda.map((entry) => {
                      const linkedTask = entry.taskId ? taskMap.get(entry.taskId) : null;

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
                                <Badge variant="secondary" className="text-[10px] font-mono gap-1">
                                  <LinkIcon className="h-3 w-3" />
                                  [{linkedTask.sectionCode || "WBS"}] {linkedTask.agenda} ({linkedTask.progression}%)
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
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={() => setDeleteTargetId(null)}
        title="Delete Daily Site Report?"
        description="Are you sure you want to delete this daily report? All associated work logs and photo records for this day will be permanently deleted."
        confirmLabel="Delete Report"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteReport}
      />
    </div>
  );
}
