import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InstallationPlanSkeleton() {
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-72 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              {/* Table Header */}
              <div className="flex items-center bg-zinc-50/50 p-4 dark:bg-zinc-900/50">
                <div className="w-12"><Skeleton className="h-4 w-6" /></div>
                <div className="w-24"><Skeleton className="h-4 w-16" /></div>
                <div className="flex-1"><Skeleton className="h-4 w-32" /></div>
                <div className="w-28"><Skeleton className="h-4 w-16" /></div>
                <div className="w-36"><Skeleton className="h-4 w-20" /></div>
                <div className="w-32"><Skeleton className="h-4 w-20" /></div>
                <div className="w-24"><Skeleton className="h-4 w-12" /></div>
              </div>

              {/* Table Rows */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center p-4">
                  <div className="w-12"><Skeleton className="h-4 w-6" /></div>
                  <div className="w-24"><Skeleton className="h-5 w-16 rounded-full" /></div>
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="w-28"><Skeleton className="h-4 w-20" /></div>
                  <div className="w-36"><Skeleton className="h-4 w-28" /></div>
                  <div className="w-32 space-y-1">
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="w-24 flex justify-end">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
