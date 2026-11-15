import { cn } from "@/lib/ui/cn";

/** Placeholder for content that is loading. Decorative for assistive technology. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rounded-control bg-ink/10 motion-safe:animate-pulse", className)}
    />
  );
}
