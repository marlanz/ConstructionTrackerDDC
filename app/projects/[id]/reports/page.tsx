import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth";
import {
  getProjectById,
  canAccessProject,
} from "@/lib/services/project.service";
import { listDailyReports } from "@/lib/services/dailyReport.service";
import { listInstallationTasks } from "@/lib/services/installationDetail.service";
import { hasMembership } from "@/lib/services/projectMember.service";
import { redirect, notFound } from "next/navigation";
import { DailyReportsView } from "./DailyReportsView";
import { DailyReportsSkeleton } from "@/components/skeletons/DailyReportsSkeleton";

interface DailyReportsPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function DailyReportsContent({
  params,
}: DailyReportsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasAccess = await canAccessProject(
    { id: user.id, role: user.role },
    id,
  );
  if (!hasAccess) {
    redirect("/projects");
  }

  const [project, reports, tasks, isSupervisor] = await Promise.all([
    getProjectById(id),
    listDailyReports(id),
    listInstallationTasks(id),
    hasMembership(user.id, id),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <DailyReportsView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      project={project}
      reports={reports}
      tasks={tasks}
      isSupervisor={isSupervisor}
    />
  );
}

export default function DailyReportsPage(props: DailyReportsPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<DailyReportsSkeleton />}>
          <DailyReportsContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}


