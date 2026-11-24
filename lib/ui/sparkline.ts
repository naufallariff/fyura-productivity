/** SVG path for a sparkline. Returns null when there are fewer than two finite values. */
export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
  range?: readonly [min: number, max: number],
): string | null {
  const points = values.filter(Number.isFinite);
  if (points.length < 2) return null;

  const [min, max] = range ?? [Math.min(...points), Math.max(...points)];
  const span = max - min;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const step = innerWidth / (points.length - 1);

  const coordinates = points.map((value, index) => ({
    x: padding + index * step,
    y: span === 0 ? height / 2 : padding + innerHeight - ((value - min) / span) * innerHeight,
  }));

  return coordinates
    .map(({ x, y }, index) => {
      const previous = coordinates[index - 1];
      if (!previous) return `M${x.toFixed(2)} ${y.toFixed(2)}`;

      // Horizontal tangents join smoothly and keep the curve within each pair of values.
      const mid = ((previous.x + x) / 2).toFixed(2);
      return `C${mid} ${previous.y.toFixed(2)} ${mid} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
