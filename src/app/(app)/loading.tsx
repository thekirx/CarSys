import { Skeleton } from "@/components/ui/skeleton";

const contentSkeletons = Array.from({ length: 4 }, (_, index) => index);

export default function ApplicationLoading() {
  return (
    <div
      data-testid="loading-content"
      className="flex min-w-0 flex-1 flex-col gap-4"
      aria-busy="true"
      aria-label="Loading page content"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="hidden h-8 w-28 sm:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {contentSkeletons.map((item) => (
          <div key={item} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-12" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-5 h-48 w-full" />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-5 h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
