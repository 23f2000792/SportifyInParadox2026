
import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto py-10 px-4">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-16 w-3/4 md:w-1/2" />
        <Skeleton className="h-4 w-2/3 md:w-1/3" />
      </div>

      {/* Filter Bar Skeleton */}
      <Skeleton className="h-16 w-full rounded-2xl" />

      {/* Tabs Skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
      </div>

      {/* Match Cards Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border rounded-xl p-6 space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-16 w-24 rounded-xl" />
              <Skeleton className="h-10 flex-1" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
