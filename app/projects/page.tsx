import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth";
import { listProjectsForUser } from "@/lib/services/project.service";
import { redirect } from "next/navigation";
import { DashboardView } from "./DashboardView";
import { ProjectListSkeleton } from "@/components/skeletons/ProjectListSkeleton";

async function ProjectsPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const projects = await listProjectsForUser({
    id: user.id,
    role: user.role,
  });

  return (
    <DashboardView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      projects={projects}
    />
  );
}

export default async function ProjectsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<ProjectListSkeleton />}>
          <ProjectsPageContent />
        </Suspense>
      </main>
    </div>
  );
}
