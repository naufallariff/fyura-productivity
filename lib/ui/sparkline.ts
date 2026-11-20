/** SVG path for a sparkline. Returns null when there are fewer than two finite values. */
export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
): string | null {
  const points = values.filter(Number.isFinite);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const step = innerWidth / (points.length - 1);

  return points
    .map((value, index) => {
      const x = padding + index * step;
      const y =
        span === 0 ? height / 2 : padding + innerHeight - ((value - min) / span) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
