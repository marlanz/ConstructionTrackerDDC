import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth";
import {
  getProjectById,
  canAccessProject,
} from "@/lib/services/project.service";
import { listInstallationTasks } from "@/lib/services/installationDetail.service";
import { hasMembership } from "@/lib/services/projectMember.service";
import { redirect, notFound } from "next/navigation";
import { InstallationPlanView } from "./InstallationPlanView";
import { InstallationPlanSkeleton } from "@/components/skeletons/InstallationPlanSkeleton";

interface InstallationPlanPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function InstallationPlanContent({
  params,
}: InstallationPlanPageProps) {
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

  const [project, tasks, isSupervisor] = await Promise.all([
    getProjectById(id),
    listInstallationTasks(id),
    hasMembership(user.id, id),
  ]);

  if (!project) {
    notFound();
  }

  return (
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
  );
}

export default function InstallationPlanPage(props: InstallationPlanPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<InstallationPlanSkeleton />}>
          <InstallationPlanContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}


