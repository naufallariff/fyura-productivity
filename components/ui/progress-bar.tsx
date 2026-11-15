export function ProgressBar({
  value,
  label,
  color = "var(--accent)",
}: {
  /** 0 to 1. */
  value: number;
  label: string;
  color?: string;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0)) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="bg-ink-muted/20 h-0.75 w-full overflow-hidden rounded-full"
    >
      <div
        className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
        style={{ width: `${percent}%`, background: color }}
      />
    </div>
  );
}
