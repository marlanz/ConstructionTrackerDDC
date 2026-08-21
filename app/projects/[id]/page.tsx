import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth";
import {
  canAccessProject,
  getProjectOverview,
} from "@/lib/services/project.service";
import { getLatestDailyReport } from "@/app/actions/dailyReport.actions";
import { redirect, notFound } from "next/navigation";
import { ProjectOverviewView } from "./ProjectOverviewView";
import { ProjectOverviewSkeleton } from "@/components/skeletons/ProjectOverviewSkeleton";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ProjectDetailContent({
  params,
}: ProjectDetailPageProps) {
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

  const [overview, latestReportResult] = await Promise.all([
    getProjectOverview(id),
    getLatestDailyReport(id),
  ]);

  if (!overview) {
    notFound();
  }

  return (
    <ProjectOverviewView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      overview={overview}
      latestReport={latestReportResult.success ? latestReportResult.data : null}
    />
  );
}

export default function ProjectDetailPage(props: ProjectDetailPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<ProjectOverviewSkeleton />}>
          <ProjectDetailContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}


