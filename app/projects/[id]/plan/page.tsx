import { getCurrentUser } from "@/lib/auth/auth";
import {
  getProjectById,
  canAccessProject,
} from "@/lib/services/project.service";
import { listInstallationTasks } from "@/app/actions/installationDetail.actions";
import { hasMembership } from "@/lib/services/projectMember.service";
import { redirect, notFound } from "next/navigation";

import { InstallationPlanView } from "./InstallationPlanView";

interface InstallationPlanPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InstallationPlanPage({
  params,
}: InstallationPlanPageProps) {
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

  const tasksResult = await listInstallationTasks(id);
  const tasks = tasksResult.success ? tasksResult.data : [];

  const isSupervisor = await hasMembership(user.id, id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <InstallationPlanView
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          project={project}
          tasks={tasks}
          isSupervisor={isSupervisor}
        />
      </main>
    </div>
  );
}
