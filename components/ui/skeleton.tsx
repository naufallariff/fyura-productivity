import { cn } from "@/lib/ui/cn";

/** Placeholder for loading content. Decorative for assistive technology. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rounded-control bg-ink/10 motion-safe:animate-pulse", className)}
    />
  );
}

/** Page-level loading state. The busy flag tells assistive technology that content is coming. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto w-full max-w-350 space-y-4 p-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
