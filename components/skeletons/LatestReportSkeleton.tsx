import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LatestReportSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Work times & reporter skeleton */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Work agenda preview items */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800 space-y-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-12 w-12 rounded-md" />
                <Skeleton className="h-12 w-12 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        <Skeleton className="h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
