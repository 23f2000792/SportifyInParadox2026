import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-3 border-b border-white/5 pb-6">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <Skeleton className="h-4 w-96 bg-white/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[250px] w-full rounded-xl bg-white/5" />
        <Skeleton className="h-[250px] w-full rounded-xl bg-white/5" />
        <Skeleton className="h-[250px] w-full rounded-xl bg-white/5" />
        <Skeleton className="h-[250px] w-full rounded-xl bg-white/5" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-48 w-full rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
