import { DailyReportsSkeleton } from "@/components/skeletons/DailyReportsSkeleton";

export default function DailyReportsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DailyReportsSkeleton />
      </main>
    </div>
  );
}
