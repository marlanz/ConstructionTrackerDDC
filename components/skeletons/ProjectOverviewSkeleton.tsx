import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LatestReportSkeleton } from "./LatestReportSkeleton";

export function ProjectOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back Link Skeleton */}
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
        <div className="flex gap-2">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex gap-4 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Right Column / Order 1 on mobile: Latest Report + Members */}
        <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
          <LatestReportSkeleton />

          {/* Project Members Card Skeleton */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Left Column / Order 2 on mobile: Main Overview Cards */}
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
          {/* Progress Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 pt-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
