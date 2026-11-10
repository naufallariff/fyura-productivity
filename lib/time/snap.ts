export const SNAP_MINUTES = 15;

export function snapMinute(minute: number, step: number = SNAP_MINUTES): number {
  return Math.round(minute / step) * step;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
