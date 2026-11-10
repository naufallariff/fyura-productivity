export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`rounded-control bg-surface-raised animate-pulse ${className}`} />
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
