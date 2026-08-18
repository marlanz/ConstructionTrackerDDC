import { getCurrentUser } from "@/lib/auth/auth";
import {
  getProjectById,
  canAccessProject,
} from "@/lib/services/project.service";
import { listDailyReports } from "@/app/actions/dailyReport.actions";
import { listInstallationTasks } from "@/app/actions/installationDetail.actions";
import { hasMembership } from "@/lib/services/projectMember.service";
import { redirect, notFound } from "next/navigation";
import { DailyReportsView } from "./DailyReportsView";

interface DailyReportsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DailyReportsPage({
  params,
}: DailyReportsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const project = await getProjectById(id);
  if (!project) {
    notFound();
  }

  const hasAccess = await canAccessProject(
    { id: user.id, role: user.role },
    id,
  );
  if (!hasAccess) {
    redirect("/projects");
  }

  const reportsResult = await listDailyReports(id);
  const reports = reportsResult.success ? reportsResult.data : [];

  const tasksResult = await listInstallationTasks(id);
  const tasks = tasksResult.success ? tasksResult.data : [];

  const isSupervisor = await hasMembership(user.id, id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
      </main>
    </div>
  );
}
