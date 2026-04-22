
import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
