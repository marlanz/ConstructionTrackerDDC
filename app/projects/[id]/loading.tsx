import { ProjectOverviewSkeleton } from "@/components/skeletons/ProjectOverviewSkeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectOverviewSkeleton />
      </main>
    </div>
  );
}
