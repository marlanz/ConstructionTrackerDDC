import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DailyReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Link Skeleton */}
      <Skeleton className="h-4 w-36" />

      {/* Header Banner Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-8 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex gap-4 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Daily Reports Cards */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Personnel & Machines */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>

              {/* Work Agenda items */}
              <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-36" />
                {Array.from({ length: 2 }).map((_, j) => (
                  <div
                    key={j}
                    className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <Skeleton className="h-16 w-16 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
